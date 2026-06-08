# GO LIVE — Complete Step by Step
## Estimated time: 45 minutes

---

## BEFORE YOU START — understand what you have

✅ Code is done (Node.js in this folder)
✅ The Odds API key (works, free tier = US odds only for now)
✅ GitHub account (clintbigboss1)
✅ Stripe live keys (in Railway already)
✅ Railway account (running WRONG code right now — Python/Uvicorn)
✅ Vercel account (frontend live)
⚠️  Upstash Redis — DO NOT USE YET (not needed)
❌ Supabase — need to create this (free database)
❌ Stripe webhook — not set up
❌ Railway running WRONG code — need to fix this

---

## STEP 1 — Create Supabase (free database) — 5 min

1. Go to supabase.com
2. "Start your project" → sign in with GitHub
3. New Project:
   - Name: shadow-syndicate
   - Password: pick a strong password (SAVE IT)
   - Region: Southeast Asia (Singapore) — closest to AU
4. Wait ~2 minutes for it to create
5. Go to: Settings → Database → Connection String → URI
6. Copy the full URI — it looks like:
   postgresql://postgres:[YOUR-PASSWORD]@db.[ref].supabase.co:5432/postgres

SAVE THIS. You need it in Step 3.

---

## STEP 2 — Push code to GitHub — 5 min

Open terminal in your shadow-signals folder:

```bash
git init
git add .
git commit -m "Shadow Syndicate — complete build"
git branch -M main
git remote add origin https://github.com/clintbigboss1/shadow-syndicate.git
git push -u origin main
```

If the repo doesn't exist, create it at github.com first:
New repo → name: shadow-syndicate → Public → Create

---

## STEP 3 — Fix Railway (replace Python with Node.js) — 10 min

1. Go to railway.app → your project
2. Click the existing service (Python one)
3. Settings → Source → Disconnect/Delete this service
4. New Service → GitHub Repo → select: clintbigboss1/shadow-syndicate
5. Root Directory: leave EMPTY (uses root)
6. Start Command: node server/index.js
7. It will try to deploy — let it fail (missing env vars)

---

## STEP 4 — Add ALL Railway environment variables — 10 min

In Railway → your service → Variables tab, add ALL of these:

```
DATABASE_URL          = postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
ODDS_API_KEY          = [your odds api key]
STRIPE_SECRET_KEY     = sk_live_[rest of your key]
STRIPE_WEBHOOK_SECRET = [get this in Step 5 below]
JWT_SECRET            = [generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
JWT_EXPIRES_IN        = 7d
FRONTEND_URL          = https://[your-vercel-app].vercel.app
PORT                  = 3001
NODE_ENV              = production
STRIPE_PRICE_STARTER_MONTH    = price_xxx
STRIPE_PRICE_PRO_MONTH  = price_xxx
STRIPE_PRICE_ELITE_MONTH  = price_xxx
CACHE_ODDS_TTL        = 45
```

Note: STRIPE_PRICE_xxx IDs — skip for now, fill in after Step 6

Redeploy Railway after adding all variables.

---

## STEP 5 — Set up Stripe webhook — 5 min

1. dashboard.stripe.com → Developers → Webhooks
2. "Add endpoint"
3. Endpoint URL: https://YOUR-RAILWAY-APP.railway.app/api/payments/webhook
   (get your Railway URL from: railway.app → your service → Deployments)
4. Select events (click each):
   ✅ checkout.session.completed
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_failed
5. "Add endpoint"
6. Click "Reveal" on the Signing secret
7. Copy it (starts with whsec_)
8. Go back to Railway Variables → add:
   STRIPE_WEBHOOK_SECRET = whsec_[your secret]
9. Redeploy Railway

---

## STEP 6 — Create Stripe products — 5 min

On your LOCAL machine (with .env filled in):

```bash
cd shadow-signals
npm install
node scripts/stripeSetup.js
```

This creates 3 products (Starter $9.99, Pro $19.99, Elite $49.99)
and saves their price IDs to your .env file.

Then copy those price IDs to Railway Variables:
STRIPE_PRICE_STARTER_MONTH    = price_xxxx (from .env)
STRIPE_PRICE_PRO_MONTH  = price_xxxx (from .env)
STRIPE_PRICE_ELITE_MONTH  = price_xxxx (from .env)

Redeploy Railway.

---

## STEP 7 — Initialise database — 2 min

With DATABASE_URL set locally in your .env:

```bash
node scripts/initDB.js
```

This creates all the tables in Supabase.

---

## STEP 8 — Verify everything is working — 3 min

Visit: https://YOUR-RAILWAY-APP.railway.app/api/health

You should see:
```json
{
  "status": "ok",
  "stripe": {
    "mode": "LIVE ✅",
    "webhook_secret": "set ✅",
    ...
  },
  "database": "set ✅",
  "odds_api": "set ✅"
}
```

If anything shows ❌, fix that variable in Railway and redeploy.

Run locally to check everything:
```bash
node scripts/setupCheck.js
```

---

## STEP 9 — Update Vercel frontend — 3 min

1. vercel.com → your project → Settings → Environment Variables
2. Add:
   NEXT_PUBLIC_API_URL = https://YOUR-RAILWAY-APP.railway.app/api
   NEXT_PUBLIC_WS_URL  = https://YOUR-RAILWAY-APP.railway.app
3. Deployments → Redeploy

---

## STEP 10 — Test the full flow — 2 min

1. Visit your Vercel URL
2. Create an account
3. Try signing up for Pro ($19.99)
4. Use test card: 4242 4242 4242 4242 (any future date, any CVC)
   (Switch Stripe to Test mode temporarily to test safely)
5. After payment, you should be redirected back and your plan should
   update to "Pro" within 30 seconds

---

## DONE ✅

Your site is live. Now get your first users:
- Post in r/aussiepunters
- Post in Discord betting servers
- Tell 5 friends who bet

3 paying users = $60/month = covers your Odds API upgrade ($79 USD)
After that: real AU bookie odds and the real product kicks in.

---

## REDIS — DON'T USE IT YET

Your Upstash Redis account is not connected and not needed.
The system runs fine without it. Redis is for when you have
thousands of users and need distributed caching.
For now: in-memory cache + Supabase = more than enough.

---

## IF SOMETHING BREAKS

1. Check Railway logs (Deployments → View Logs)
2. Visit /api/health — shows exactly what's misconfigured
3. Run: node scripts/setupCheck.js locally
4. The most common issues:
   - Wrong DATABASE_URL (wrong password)
   - STRIPE_WEBHOOK_SECRET not set
   - FRONTEND_URL still set to localhost
