const router = require('express').Router();
const express = require('express');
const { GuildSettings } = require('../../database/models/guild');

const stripeEnabled = !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_XXXX'));

let stripe;
if (stripeEnabled) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Not authenticated' });
}

// ── Auto-create Stripe products and prices ──
const PRICE_CACHE = {};

async function ensurePrices() {
    if (!stripeEnabled || PRICE_CACHE.ready) return;

    try {
        // Find existing product
        const products = await stripe.products.list({ limit: 1 });
        let product = products.data.find(p => p.metadata?.app === 'kerybot-premium');

        if (!product) {
            product = await stripe.products.create({
                name: 'kerybot Premium',
                description: 'Unlock all premium features of kerybot',
                metadata: { app: 'kerybot-premium' }
            });
        }

        // Find existing prices for product
        const existingPrices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });

        // Lifetime (one-time payment)
        PRICE_CACHE.lifetime = existingPrices.data.find(p =>
            p.type === 'one_time' && p.metadata?.plan === 'lifetime'
        );
        if (!PRICE_CACHE.lifetime) {
            PRICE_CACHE.lifetime = await stripe.prices.create({
                product: product.id,
                unit_amount: 1999, // 19.99€
                currency: 'eur',
                metadata: { plan: 'lifetime' }
            });
        }

        // Yearly
        PRICE_CACHE.yearly = existingPrices.data.find(p =>
            p.recurring?.interval === 'year' && p.metadata?.plan === 'yearly'
        );
        if (!PRICE_CACHE.yearly) {
            PRICE_CACHE.yearly = await stripe.prices.create({
                product: product.id,
                unit_amount: 999, // 9.99€/año
                currency: 'eur',
                recurring: { interval: 'year' },
                metadata: { plan: 'yearly' }
            });
        }

        // Monthly
        PRICE_CACHE.monthly = existingPrices.data.find(p =>
            p.recurring?.interval === 'month' && p.metadata?.plan === 'monthly'
        );
        if (!PRICE_CACHE.monthly) {
            PRICE_CACHE.monthly = await stripe.prices.create({
                product: product.id,
                unit_amount: 199, // 1.99€/mes
                currency: 'eur',
                recurring: { interval: 'month' },
                metadata: { plan: 'monthly' }
            });
        }

        PRICE_CACHE.ready = true;
        console.log('[STRIPE] Products and prices ready');
    } catch (err) {
        console.error('[STRIPE] Error creating products/prices:', err.message);
    }
}

// Initialize on load
if (stripeEnabled) ensurePrices();

// Create checkout session
router.post('/checkout', isAuthenticated, async (req, res) => {
    if (!stripeEnabled) {
        return res.status(503).json({ error: 'Stripe is not configured' });
    }

    await ensurePrices();
    if (!PRICE_CACHE.ready) {
        return res.status(503).json({ error: 'Stripe is not ready, try again' });
    }

    const { guildId, plan } = req.body;

    if (!guildId || !plan || !PRICE_CACHE[plan]) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    // Verify user has access to guild
    const userGuild = req.user.guilds.find(g => g.id === guildId);
    if (!userGuild) {
        return res.status(403).json({ error: 'No access to server' });
    }

    const guild = req.client.guilds.cache.get(guildId);
    if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
    }

    try {
        // Find or create Stripe customer
        let settings = await GuildSettings.findOne({ guildId });
        let customerId = settings?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                metadata: {
                    guild_id: guildId,
                    guild_name: guild.name,
                    discord_user_id: req.user.id,
                    discord_username: req.user.username
                }
            });
            customerId = customer.id;

            await GuildSettings.findOneAndUpdate(
                { guildId },
                { $set: { stripe_customer_id: customerId } },
                { upsert: true }
            );
        }

        const isOneTime = plan === 'lifetime';
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const sessionConfig = {
            customer: customerId,
            line_items: [{ price: PRICE_CACHE[plan].id, quantity: 1 }],
            mode: isOneTime ? 'payment' : 'subscription',
            success_url: `${baseUrl}/dashboard/${guildId}/premium?status=success`,
            cancel_url: `${baseUrl}/dashboard/${guildId}/premium?status=cancelled`,
            metadata: {
                guild_id: guildId,
                plan,
                activated_by: req.user.id
            }
        };

        if (!isOneTime) {
            sessionConfig.subscription_data = {
                metadata: {
                    guild_id: guildId,
                    plan,
                    activated_by: req.user.id
                }
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        res.json({ url: session.url });
    } catch (err) {
        console.error('[STRIPE] Error creating checkout:', err.message);
        res.status(500).json({ error: 'Error creating checkout session' });
    }
});

// Webhook handler — mounted directly in server.js with raw body
async function handleWebhook(req, res) {
    if (!stripeEnabled) return res.sendStatus(200);

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('[STRIPE] Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[STRIPE] Event received: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const guildId = session.metadata.guild_id;
                const plan = session.metadata.plan;
                const activatedBy = session.metadata.activated_by;

                if (plan === 'lifetime') {
                    await GuildSettings.findOneAndUpdate(
                        { guildId },
                        {
                            $set: {
                                premium: true,
                                premium_type: 'lifetime',
                                premium_until: null,
                                premium_activated_by: activatedBy
                            }
                        },
                        { upsert: true }
                    );
                } else {
                    const subscriptionId = session.subscription;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const periodEnd = new Date(subscription.current_period_end * 1000);

                    await GuildSettings.findOneAndUpdate(
                        { guildId },
                        {
                            $set: {
                                premium: true,
                                premium_type: plan,
                                premium_until: periodEnd,
                                premium_activated_by: activatedBy,
                                stripe_subscription_id: subscriptionId
                            }
                        },
                        { upsert: true }
                    );
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object;
                if (!invoice.subscription) break;

                const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                const guildId = subscription.metadata.guild_id;
                if (!guildId) break;

                const periodEnd = new Date(subscription.current_period_end * 1000);

                await GuildSettings.findOneAndUpdate(
                    { guildId },
                    {
                        $set: {
                            premium: true,
                            premium_until: periodEnd
                        }
                    }
                );
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const guildId = subscription.metadata.guild_id;
                if (!guildId) break;

                await GuildSettings.findOneAndUpdate(
                    { guildId },
                    {
                        $set: {
                            premium: false,
                            premium_type: null,
                            premium_until: null,
                            stripe_subscription_id: null
                        }
                    }
                );
                break;
            }
        }
    } catch (err) {
        console.error('[STRIPE] Webhook handler error:', err.message);
    }

    res.sendStatus(200);
}

// Cancel subscription
router.post('/cancel', isAuthenticated, async (req, res) => {
    if (!stripeEnabled) {
        return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { guildId } = req.body;
    if (!guildId) return res.status(400).json({ error: 'Missing guildId' });

    const settings = await GuildSettings.findOne({ guildId });
    if (!settings?.stripe_subscription_id) {
        return res.status(400).json({ error: 'No active subscription' });
    }

    try {
        await stripe.subscriptions.update(settings.stripe_subscription_id, {
            cancel_at_period_end: true
        });
        res.json({ success: true, message: 'Subscription will cancel at end of period' });
    } catch (err) {
        console.error('[STRIPE] Cancel error:', err.message);
        res.status(500).json({ error: 'Error cancelling subscription' });
    }
});

module.exports = {
    router,
    webhookHandler: [express.raw({ type: 'application/json' }), handleWebhook]
};
