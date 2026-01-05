
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// We need SERVICE ROLE key here to bypass RLS when updating subscriptions
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
        return new Response('Error: missing stripe-signature header', { status: 400 })
    }

    try {
        const body = await req.text()
        // Verify signature
        let event
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret)
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`)
            return new Response(`Webhook Error: ${err.message}`, { status: 400 })
        }

        console.log(`Event detected: ${event.type}`)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            await handleCheckoutCompleted(session)
        }

        // Handle subscription updates (cancellations, renewals, etc.)
        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object
            await handleSubscriptionUpdated(subscription)
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object
            await handleSubscriptionDeleted(subscription)
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

async function handleCheckoutCompleted(session: any) {
    const userId = session.metadata?.supabase_user_id
    if (!userId) {
        console.error('Missing userId in metadata')
        return
    }

    // 1. Subscription Purchase
    if (session.mode === 'subscription') {
        const subscriptionId = session.subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Find plan ID from product metadata
        const priceId = subscription.items.data[0].price.id
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string)
        const planId = product.metadata.plan_id

        if (!planId) {
            console.error('Could not find plan_id in product metadata')
            return
        }

        // Upsert into subscriptions table
        const { error } = await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscriptionId,
            is_lifetime: planId === 'lifetime' // Special case handling if needed
        })

        if (error) console.error('Error updating subscription:', error)
        else console.log(`Active subscription for user ${userId} set to ${planId}`)

        // Reset Quotas for New Plan
        // Ideally we fetch plan limits and update usage_tracking
        // For now, let's just ensure usage_tracking row exists
        // (The app logic or a trigger should handle limit resets on plan change)
    }

    // 2. One-Time Purchase (Lifetime or Add-on)
    if (session.mode === 'payment' && session.payment_status === 'paid') {
        // Retrieve line items to see what was bought
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

        for (const item of lineItems.data) {
            const product = await stripe.products.retrieve(item.price?.product as string)

            // A. Add-on (Consumable)
            if (product.metadata.type === 'consumable') {
                const addonId = product.metadata.addon_id
                const credits = parseInt(product.metadata.credits || '0', 10)

                // Upsert User Addon
                // Check if user already has this addon active? Or just increment usage?
                // Strategy: We log the purchase in user_addons and increment the limit in usage_tracking

                // 1. Log purchase
                await supabase.from('user_addons').insert({
                    user_id: userId,
                    addon_id: addonId,
                    purchase_date: new Date().toISOString(),
                    status: 'active',
                    remaining_value: { credits: credits } // Simplified tracking
                })

                // 2. Imediately Apply Credits (Increment Limit)
                // NOTE: This assumes 'ai_calls' is the metric. Product metadata should specify metric.
                // For now hardcoded to 'ai_calls' for the demo packs.
                const metric = 'ai_calls'

                // Fetch current tracking
                const { data: usage } = await supabase.from('usage_tracking').select('limit').eq('user_id', userId).eq('metric', metric).single()

                const currentLimit = usage?.limit || 10 // default
                // If limit is -1 (unlimited), adding credits does nothing.
                if (currentLimit !== -1) {
                    const newLimit = currentLimit + credits
                    await supabase.from('usage_tracking').upsert({
                        user_id: userId,
                        metric: metric,
                        limit: newLimit
                    }, { onConflict: 'user_id,metric' })
                    console.log(`Boosted ${metric} limit for ${userId} by ${credits}`)
                }
            }

            // B. Lifetime Plan (Mode payment)
            if (product.metadata.plan_id && product.metadata.plan_id === 'lifetime') {
                const planId = 'lifetime'

                await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    plan_id: planId,
                    status: 'active',
                    current_period_end: new Date(2099, 11, 31).toISOString(), // Far future
                    stripe_customer_id: session.customer,
                    is_lifetime: true
                })
                console.log(`Lifetime access granted to ${userId}`)
            }
        }
    }
}

async function handleSubscriptionUpdated(subscription: any) {
    const stripeSubscriptionId = subscription.id

    // Find user by subscription id
    const { data: record } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', stripeSubscriptionId).single()

    if (!record) return

    const status = subscription.status // active, past_due, canceled, etc.
    const priceId = subscription.items.data[0].price.id
    // Update status
    await supabase.from('subscriptions').update({
        status: status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    }).eq('stripe_subscription_id', stripeSubscriptionId)

    console.log(`Subscription ${stripeSubscriptionId} updated to ${status}`)
}

async function handleSubscriptionDeleted(subscription: any) {
    const stripeSubscriptionId = subscription.id
    await supabase.from('subscriptions').update({
        status: 'canceled'
    }).eq('stripe_subscription_id', stripeSubscriptionId)
    console.log(`Subscription ${stripeSubscriptionId} canceled`)
}
