
import Stripe from 'stripe';

// INSTRUCTIONS:
// 1. Install stripe: npm install stripe
// 2. Set your STRIPE_SECRET_KEY env var or replace below
// 3. Run: npx ts-node configure_stripe_products.ts

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
    apiVersion: '2024-12-18.acacia',
});

const PRODUCTS = [
    {
        name: 'Plume Writer',
        description: 'For passionate writers',
        metadata: { plan_id: 'writer', tier: 'subscription' },
        prices: [
            { unit_amount: 990, currency: 'eur', recurring: { interval: 'month' }, metadata: { type: 'monthly' } },
            { unit_amount: 9900, currency: 'eur', recurring: { interval: 'year' }, metadata: { type: 'yearly' } },
        ]
    },
    {
        name: 'Plume Biographer',
        description: 'Advanced features for biographers',
        metadata: { plan_id: 'biographer', tier: 'subscription' },
        prices: [
            { unit_amount: 1990, currency: 'eur', recurring: { interval: 'month' }, metadata: { type: 'monthly' } },
            { unit_amount: 19900, currency: 'eur', recurring: { interval: 'year' }, metadata: { type: 'yearly' } },
        ]
    },
    {
        name: 'Plume Family',
        description: 'Share with your family',
        metadata: { plan_id: 'family', tier: 'subscription' },
        prices: [
            { unit_amount: 2990, currency: 'eur', recurring: { interval: 'month' }, metadata: { type: 'monthly' } },
            { unit_amount: 29900, currency: 'eur', recurring: { interval: 'year' }, metadata: { type: 'yearly' } },
        ]
    },
    // Add-ons
    {
        name: 'Recharge IA (50 crédits)',
        description: '50 appels IA supplémentaires',
        metadata: { addon_id: 'ai_pack_50', type: 'consumable', credits: '50' },
        prices: [
            { unit_amount: 499, currency: 'eur', metadata: { type: 'one_time' } }
        ]
    },
    {
        name: 'Recharge IA (200 crédits)',
        description: '200 appels IA supplémentaires',
        metadata: { addon_id: 'ai_pack_200', type: 'consumable', credits: '200' },
        prices: [
            { unit_amount: 1499, currency: 'eur', metadata: { type: 'one_time' } }
        ]
    }
];

async function main() {
    console.log("🚀 Configuring Stripe Products...");

    for (const p of PRODUCTS) {
        console.log(`Checking ${p.name}...`);

        // Check if product exists (by name to be simple)
        const existing = await stripe.products.search({ query: `name:'${p.name}'` });

        let productId;

        if (existing.data.length > 0) {
            console.log(`✅ ${p.name} already exists.`);
            productId = existing.data[0].id;
        } else {
            const product = await stripe.products.create({
                name: p.name,
                description: p.description,
                metadata: p.metadata as any
            });
            console.log(`✨ Created product: ${product.name} (${product.id})`);
            productId = product.id;
        }

        // Create Prices
        for (const price of p.prices) {
            // Very basic check to avoid duplicates: listing prices for product
            const prices = await stripe.prices.list({ product: productId, limit: 10 });
            const priceExists = prices.data.some(existingPrice =>
                existingPrice.unit_amount === price.unit_amount &&
                existingPrice.currency === price.currency &&
                ((existingPrice.recurring?.interval === (price.recurring as any)?.interval) || (!existingPrice.recurring && !price.recurring))
            );

            if (!priceExists) {
                await stripe.prices.create({
                    product: productId,
                    unit_amount: price.unit_amount,
                    currency: price.currency,
                    recurring: price.recurring as any,
                    metadata: price.metadata
                });
                console.log(`  ➕ Created price: ${price.unit_amount / 100}€`);
            } else {
                console.log(`  ✅ Price ${price.unit_amount / 100}€ exists.`);
            }
        }
    }
    console.log("🎉 Configuration Complete!");
}

main().catch(console.error);
