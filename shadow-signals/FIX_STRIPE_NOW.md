# Fix Stripe — Plans Not Updating After Payment

## The exact problem
When someone pays and gets redirected back to your site, their plan
stays as "free". This is because the Stripe webhook is either:
1. Not set up in the Stripe dashboard
2. Set up but STRIPE_WEBHOOK_SECRET is wrong in Railway
3. The webhook endpoint isn't getting the raw body (fixed in code)

## Fix it in 5 minutes

### Step 1 — Get your webhook secret

Go to: https://dashboard.stripe.com/webhooks

Click "Add endpoint" (or edit existing one):
- Endpoint URL: https://YOUR-RAILWAY-APP.railway.app/api/payments/webhook
  (replace with your actual Railway URL)
- Select these events:
  ✅ checkout.session.completed
  ✅ customer.subscription.updated  
  ✅ customer.subscription.deleted
  ✅ invoice.payment_failed

Click "Add endpoint" → you'll see a "Signing secret" starting with whsec_
Click "Reveal" and copy it.

### Step 2 — Add to Railway

Go to: railway.app → your backend project → Variables

Add/update:
  STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxx  (your actual secret)

Make sure you also have:
  STRIPE_SECRET_KEY     = sk_live_
  STRIPE_PRICE_STARTER_MONTH    = price_xxxx
  STRIPE_PRICE_PRO_MONTH  = price_xxxx  
  STRIPE_PRICE_ELITE_MONTH  = price_xxxx

### Step 3 — Redeploy backend

In Railway → Deployments → click "Redeploy" (or it auto-deploys).

### Step 4 — Verify it's working

Visit: https://YOUR-RAILWAY-APP.railway.app/api/health

You should see:
  "stripe":  "LIVE ✅"
  "webhook": "configured ✅"

If webhook still says NOT SET → the env var didn't save correctly in Railway.

### Step 5 — Test the full flow

1. Create a new account on your site
2. Go to pricing, click upgrade
3. Use Stripe test card: 4242 4242 4242 4242 (any future date, any CVC)
   (Switch to test mode temporarily in Stripe to test safely)
4. Complete payment
5. You'll be redirected to /dashboard?upgraded=true
6. The page polls /api/payments/status every 5 seconds
7. Within 30 seconds your plan should update to pro

### If it still doesn't work

Check Railway logs after a payment:
- Look for "📩 Webhook received: checkout.session.completed"
- If you see "❌ Stripe webhook signature failed" → wrong webhook secret
- If you see nothing at all → wrong endpoint URL in Stripe dashboard

The webhook URL must match EXACTLY:
  https://your-app.railway.app/api/payments/webhook
  (no trailing slash, no extra path)

## Price IDs — if you haven't run stripeSetup.js

```bash
# On your local machine with .env filled in:
node scripts/stripeSetup.js
```

This creates the Stripe products and saves the price_xxx IDs to .env.
Then copy those price IDs to Railway environment variables.
