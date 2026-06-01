# Complete Honest Audit — Shadow Syndicate
## What you actually have vs what you need

---

## YOUR ACCOUNTS (from browser tabs)

| Account | What it's for | Status |
|---------|--------------|--------|
| The Odds API | Real AU bookie odds | ✅ Have it |
| GitHub (clintbigboss1) | Code hosting | ✅ Have it |
| Upstash Redis | Caching (NOT needed yet) | ⚠️ Don't use yet |
| Railway | Backend hosting | ✅ Running (wrong code) |
| Vercel (Home-Shadow) | Frontend hosting | ✅ Deployed |
| Stripe | Payments | ✅ Live keys, no webhook |

---

## THE BIG PROBLEM

Your Railway is running **Python/Uvicorn** — a completely different
backend to the Node.js code we've been building.

Two possibilities:
1. You deployed an old/different project to Railway by accident
2. Someone gave you Python starter code before this session

**Either way: your Railway backend and your frontend are NOT talking
to each other.** That's why nothing works end-to-end.

---

## WHAT YOU DON'T HAVE YET (that you need)

| Thing | Why needed | Cost |
|-------|-----------|------|
| Supabase account | Database for users, bets, odds | FREE |
| DATABASE_URL in Railway | Backend can't start without it | $0 |
| STRIPE_WEBHOOK_SECRET in Railway | Plans don't update after payment | $0 |
| Stripe products created | No prices to charge | $0 (run setup script) |

---

## THE EXACT STEPS TO GO LIVE (in order)

### Step 1 — Create Supabase (5 minutes)
1. Go to supabase.com
2. Sign up with GitHub
3. New project → call it "shadow-syndicate"
4. Choose region: Australia Southeast 1
5. Settings → Database → Connection String → URI
6. Copy the URI (looks like: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres)

### Step 2 — Push our Node.js code to GitHub
Your shadow-signals folder = the correct backend.
Push it to your GitHub repo (clintbigboss1/shadow-signals).

### Step 3 — Redeploy Railway with correct code
1. Railway → your project → Settings → disconnect current deploy
2. Connect to your GitHub repo (clintbigboss1/shadow-signals)
3. Set Root Directory: . (root, not /client)
4. Start Command: node server/index.js

### Step 4 — Set ALL Railway environment variables
```
DATABASE_URL          = postgresql://... (from Supabase)
ODDS_API_KEY          = your key
STRIPE_SECRET_KEY     = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_... (get from step 5)
JWT_SECRET            = (run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_EXPIRES_IN        = 7d
FRONTEND_URL          = https://your-vercel-url.vercel.app
PORT                  = 3001
NODE_ENV              = production
STRIPE_PRICE_RECRUIT_MONTH    = price_xxx (from step 6)
STRIPE_PRICE_COMMANDER_MONTH  = price_xxx (from step 6)
STRIPE_PRICE_SYNDICATE_MONTH  = price_xxx (from step 6)
```

### Step 5 — Set up Stripe webhook
1. dashboard.stripe.com → Developers → Webhooks → Add endpoint
2. URL: https://YOUR-RAILWAY-URL.railway.app/api/payments/webhook
3. Events: checkout.session.completed, customer.subscription.updated,
           customer.subscription.deleted, invoice.payment_failed
4. Copy the signing secret → STRIPE_WEBHOOK_SECRET in Railway

### Step 6 — Create Stripe products
After Railway is running with all env vars:
Run locally: node scripts/stripeSetup.js
This creates your 3 plans and saves price IDs to .env
Then manually add those price IDs to Railway variables.

### Step 7 — Init database
Visit: https://YOUR-RAILWAY-URL/api/health
If DATABASE_URL is set, run:
POST https://YOUR-RAILWAY-URL/api/init (or run locally: node scripts/initDB.js with DATABASE_URL set)

### Step 8 — Update Vercel
In Vercel → your project → Settings → Environment Variables:
NEXT_PUBLIC_API_URL = https://YOUR-RAILWAY-URL.railway.app/api
NEXT_PUBLIC_WS_URL  = https://YOUR-RAILWAY-URL.railway.app
Redeploy Vercel.

### Step 9 — Test it
1. Visit your Vercel URL
2. Sign up for an account
3. Check Railway logs — should see "✅ Database schema ready"
4. Visit your-railway-url/api/health — everything should be green

---

## REDIS — DO YOU NEED IT?

NO. Not yet. The Upstash Redis account you opened is not needed
for the first version. Our code uses:
- L1 cache: Node.js in-memory (free, fast)
- L2 cache: PostgreSQL (Supabase, free)

Redis would be added later for scale. Don't connect it now,
it will only add complexity.

---

## THE ODDS API — FREE TIER WARNING

Your free tier (500 calls/month) does NOT include AU bookmakers.
It only has US books (DraftKings, FanDuel etc).

For real AU odds (Sportsbet, TAB, Bet365) you need the paid plan
($79 USD/month).

While you're getting set up and testing, the free tier will work
to prove the system works — you just won't have AU-specific odds.

Once you get your first 4 paying users ($80/mo), the Odds API
pays for itself.

---

## BOTTOM LINE

You are closer than you think. The code is done.
You just need to:
1. Create Supabase (5 min)
2. Redeploy Railway with OUR Node.js code
3. Add all the env variables
4. Set up Stripe webhook
5. Done

Total time if you follow these steps: 45 minutes.
