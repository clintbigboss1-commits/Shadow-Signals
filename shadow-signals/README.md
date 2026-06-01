# Shadow Signals — +EV Betting Intelligence Platform

Australia's #1 real-time odds scanner across 12 AU bookies.

## Quick Start

### 1. Get your free API keys
- **The Odds API**: [the-odds-api.com](https://the-odds-api.com) (500 free calls/month)
- **Supabase** (free DB): [supabase.com](https://supabase.com)
- **Stripe** (payments): [stripe.com](https://stripe.com)

### 2. Set up environment
```bash
cp .env.example .env
# Fill in ODDS_API_KEY, DATABASE_URL, STRIPE keys, JWT_SECRET
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Install dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 4. Test your API keys
```bash
node scripts/testAPI.js
```

### 5. Initialise the database
```bash
node scripts/initDB.js
```

### 6. Set up Stripe products (optional, skip for dev)
```bash
node scripts/stripeSetup.js
```

### 7. Run everything
```bash
# Terminal 1 — Backend on :3001
npm run server

# Terminal 2 — Frontend on :3000
npm run client

# OR both at once:
npm run dev
```

Open: http://localhost:3000

---

## API Budget (staying in the free tier)

| Source          | Calls/month | Cost |
|-----------------|-------------|------|
| The Odds API    | ~235        | $0   |
| ESPN            | Unlimited   | $0   |
| TheSportsDB     | Unlimited   | $0   |
| BallDontLie     | Unlimited   | $0   |
| EV calculations | Unlimited   | $0   |
| Arb finder      | Unlimited   | $0   |

Total monthly infrastructure cost: **$0** (on free tiers)

---

## Deploy

**Backend → Railway**
1. Push to GitHub
2. railway.app → New Project → Deploy from GitHub
3. Add all `.env` vars
4. Done → get URL like `https://shadow-api.railway.app`

**Frontend → Vercel**
1. vercel.com → Import repo → set Root Directory to `client`
2. Add env vars:
   - `NEXT_PUBLIC_API_URL=https://shadow-api.railway.app/api`
   - `NEXT_PUBLIC_WS_URL=https://shadow-api.railway.app`
3. Deploy

Update backend `FRONTEND_URL` to your Vercel URL.

---

## Tech Stack

- **Backend**: Node.js + Express + Socket.io + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript
- **Auth**: JWT (bcryptjs)
- **Payments**: Stripe (subscriptions, webhooks)
- **Free APIs**: The Odds API, ESPN, TheSportsDB, BallDontLie
- **Caching**: L1 (in-memory) + L2 (PostgreSQL)
