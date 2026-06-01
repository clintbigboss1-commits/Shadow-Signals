# Honest Reality Check — Shadow Signals

## What you're actually building vs what was described

### The gap nobody told you

The backend code I wrote is solid. But here's what you need to know
before spending another hour on this:

---

## 🔴 Things you were NOT told

### 1. The Odds API costs $79 USD/month for real AU data
The "500 free calls/month" tier does NOT include:
- Sportsbet
- TAB  
- Ladbrokes
- Neds
- PointsBet
- BlueBet

The free tier only has US bookmakers (DraftKings, FanDuel etc).
To get real AU bookies you need the $79/month plan.

**Your options with $0:**
- Use the free tier to prove the concept works (US odds)
- Wait until you have $79 USD (~$120 AUD) before going live

### 2. The infrastructure IS genuinely free
- Supabase: Free (500MB, plenty for this)
- Railway: Free $5 credit/month (enough for low traffic)
- Vercel: Completely free
- Domain: ~$15/year (not monthly)

**Real monthly cost with paying users: ~$0-5 AUD**

### 3. What you actually need to launch and CHARGE people

Minimum viable:
- Working login/signup ✅ (built)
- Real AU odds (needs $79/mo Odds API OR Betfair API — free with account)
- Stripe working ✅ (built)
- One page that clearly shows value

You do NOT need:
- WebSockets (polling every 60s is fine to start)
- Arb finder (complex, adds risk — add later)
- CLV tracker (useful but not day-1)
- Multiple plan tiers (start with one price)

### 4. Betfair Exchange API is actually free
If you open a Betfair AU account (free), you get API access.
Betfair has real AU odds for AFL, NRL, Racing etc.
This is how you get real data at $0/month.

---

## ✅ Realistic launch plan with $0

### Week 1 — Get it live free
1. Deploy backend to Railway (free tier)
2. Deploy frontend to Vercel (free)
3. Use Betfair API (free) for real AU odds
4. One plan: $19.99/month
5. Get 3 paying users = $60/month
6. Use that to pay for The Odds API

### Week 2 — With first revenue
7. Buy The Odds API ($79 USD = ~$120 AUD)
8. Now you have 12 AU bookies
9. Real EV calculations
10. Charge properly

### Month 2 — Scale
- 10 users × $19.99 = $200/month
- Costs: ~$120 (Odds API) + $5 (hosting) = $125
- Profit: $75/month
- Reinvest into growth

---

## 🎯 What actually makes money in this space

### Things OddsJam/Betburger charge for that you can replicate:
1. **+EV scanner** — your core product ✅
2. **Odds comparison table** — dead simple, high value
3. **Best odds finder** — "who has the best price for X right now"
4. **Historical edge tracker** — did your EV bets actually beat closing?

### Things that sound impressive but don't make money early:
- Arb finder (margins too thin, users get limited fast)
- CLV tracker (small audience)
- API access (enterprise, not day-1)
- Mobile app (way too early)

---

## 💡 Honest pricing recommendation

**Don't do 3 tiers yet. One tier.**

$19.99/month AUD
- Full +EV scanner
- 12 AU bookies
- AFL, NRL, Cricket, Racing
- That's it.

Once you have 20+ users, THEN split into tiers based on what
they actually ask you for.

---

## 🚀 Your actual next step (today, free)

1. Open Betfair AU account at betfair.com.au
2. Apply for API access (free, takes 1-2 days)
3. Deploy what we've built to Railway + Vercel
4. Set up Stripe with one $19.99/month product
5. Post in r/aussiepunters or AFL betting Discord
6. Get 3 users. That's $60. Buy the proper API key.

The product works. You just need real AU data flowing.
Betfair gets you there at $0.

---

## Summary

| Thing | Cost | Needed Day 1? |
|-------|------|---------------|
| Supabase DB | $0 | YES |
| Railway hosting | $0 | YES |
| Vercel frontend | $0 | YES |
| Betfair API | $0 | YES (interim) |
| The Odds API | $120 AUD/mo | After first revenue |
| Domain name | $15/year | Nice to have |
| Stripe | $0 + 1.75% per txn | YES |

**Total day-1 cost: $0**
**After 3 paying users: self-funding**
