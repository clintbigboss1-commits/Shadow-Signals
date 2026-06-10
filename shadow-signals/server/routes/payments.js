'use strict';
const express = require('express');
const Stripe  = require('stripe');
const { requireAuth } = require('../middleware/auth');
const { db }   = require('../db');
const emails   = require('../services/emails');
const { createNotification } = require('../services/notifications');

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-04-10' });
}

function prices() {
  return {
    free:    process.env.STRIPE_PRICE_FREE_MONTH,
    starter: process.env.STRIPE_PRICE_STARTER_MONTH,
    pro:     process.env.STRIPE_PRICE_PRO_MONTH,
    elite:   process.env.STRIPE_PRICE_ELITE_MONTH,
  };
}

// ── Exported webhook handler (mounted with raw body in index.js) ───────────
async function webhookHandler(req, res) {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return res.status(400).json({ error: err.message });
  }

  console.log(`📩 Webhook: ${event.type}`);

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.metadata?.userId;
        const plan    = session.metadata?.plan;
        if (!userId || !plan) break;

        await db.query(
          `UPDATE users SET
             stripe_customer_id = $1, stripe_subscription_id = $2,
             plan = $3, subscription_status = 'active', updated_at = NOW()
           WHERE id = $4`,
          [session.customer, session.subscription, plan, userId]
        );

        const userRow = await db.query('SELECT email, name FROM users WHERE id = $1', [userId]);
        if (userRow.rows[0]) {
          emails.sendSubscriptionConfirmed(userRow.rows[0], plan).catch(() => {});
        }
        const planNames = { starter: 'Starter', pro: 'Pro', elite: 'Elite' };
        createNotification(userId, 'plan_activated', `${planNames[plan] || plan} plan activated ✅`, 'Full access unlocked. Head to Markets to find your edge.', '/markets').catch(() => {});

        console.log(`✅ Plan activated: ${plan} for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub  = event.data.object;
        const plan = sub.metadata?.plan || null;
        await db.query(
          `UPDATE users SET subscription_status = $1, plan = COALESCE($2, plan), updated_at = NOW()
           WHERE stripe_customer_id = $3`,
          [sub.status, plan, sub.customer]
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await db.query(
          `UPDATE users SET plan = 'free', subscription_status = 'cancelled', updated_at = NOW()
           WHERE stripe_customer_id = $1`,
          [sub.customer]
        );
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object;
        await db.query(
          `UPDATE users SET subscription_status = 'past_due', updated_at = NOW()
           WHERE stripe_customer_id = $1`,
          [inv.customer]
        );
        // Send payment failed email
        const userRow = await db.query(
          'SELECT id, email, name FROM users WHERE stripe_customer_id = $1',
          [inv.customer]
        );
        if (userRow.rows[0]) {
          emails.sendPaymentFailed(userRow.rows[0]).catch(() => {});
          createNotification(userRow.rows[0].id, 'payment_failed', 'Payment failed ⚠️', 'Update your payment method to keep your access.', '/dashboard').catch(() => {});
        }
        break;
      }

      // Trial ending — send email 2 days before
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object;
        const userRow = await db.query(
          'SELECT email, name FROM users WHERE stripe_customer_id = $1',
          [sub.customer]
        );
        if (userRow.rows[0]) {
          emails.sendTrialEnding(userRow.rows[0]).catch(() => {});
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook processing error:', err.message);
    res.json({ received: true });
  }
}

// ── Router ─────────────────────────────────────────────────────────────────
const router = express.Router();

router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const p = prices();
    if (!plan || !p[plan])
      return res.status(400).json({ error: `Invalid plan: ${plan}` });
    if (!p[plan] || p[plan] === 'price_xxx')
      return res.status(500).json({ error: 'Price ID not set. Run: node scripts/stripeSetup.js' });

    const userRow = await db.query(
      'SELECT stripe_customer_id, email FROM users WHERE id = $1',
      [req.user.userId]
    );
    const user = userRow.rows[0];

    const params = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: p[plan], quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { plan, userId: req.user.userId },
      },
      metadata: { plan, userId: req.user.userId },
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true&plan=${plan}`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing`,
    };

    if (user?.stripe_customer_id) {
      params.customer = user.stripe_customer_id;
    } else {
      params.customer_email = user?.email || req.user.email;
    }

    const session = await stripe().checkout.sessions.create(params);
    console.log(`✅ Checkout: ${session.id} plan=${plan} user=${req.user.userId}`);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/portal', requireAuth, async (req, res) => {
  try {
    const row = await db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.user.userId]
    );
    const cid = row.rows[0]?.stripe_customer_id;
    if (!cid)
      return res.status(400).json({ error: 'No active subscription found' });

    const session = await stripe().billingPortal.sessions.create({
      customer: cid,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const row = await db.query(
      'SELECT plan, subscription_status, stripe_customer_id FROM users WHERE id = $1',
      [req.user.userId]
    );
    const u = row.rows[0];
    res.json({
      plan:             u?.plan || 'free',
      status:           u?.subscription_status || 'none',
      has_subscription: !!u?.stripe_customer_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.webhookHandler = webhookHandler;
