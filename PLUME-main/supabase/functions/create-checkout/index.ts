
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
})
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { priceId, successUrl, cancelUrl, mode = 'subscription', userId } = await req.json()

        if (!userId) {
            throw new Error('User ID is required')
        }

        // Initialize Supabase Client to check user's email if needed
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: req.headers.get('Authorization')! } },
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // Get customer ID if exists, OR create one
        // Ideally we store stripe_customer_id in a 'profiles' or 'subscriptions' table.
        // For MVP, we can rely on Stripe's email matching or search.
        // Let's Fetch subscription record to see if we have a customer_id
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single()

        let customerId = subscription?.stripe_customer_id

        if (!customerId) {
            // Search by email just in case
            const customers = await stripe.customers.list({ email: user.email, limit: 1 })
            if (customers.data.length > 0) {
                customerId = customers.data[0].id
            } else {
                // Create new customer
                const customer = await stripe.customers.create({
                    email: user.email,
                    metadata: { supabase_user_id: userId }
                })
                customerId = customer.id
            }
        }

        // Create Checkout Session
        const sess: any = {
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: mode, // 'subscription' or 'payment'
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                supabase_user_id: userId // CRITICAL for webhook matching
            }
        }

        // If it's a subscription, we might want to allow promotion codes
        if (mode === 'subscription') {
            sess.allow_promotion_codes = true;
        }

        const session = await stripe.checkout.sessions.create(sess)

        return new Response(
            JSON.stringify({ sessionId: session.id, url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
