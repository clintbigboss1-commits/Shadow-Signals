# Comprehensive Pricing Strategy & Monetization Optimization
## Shadow Signals

### 1. Optimal Price Points & Pricing Structure

**Current Structure:**
- Free 3-day (or 7-day) trial
- Starter: $9.99/month
- Pro: $19.99/month (highlighted)
- Elite: $49.99/month

**Recommended Optimization:**
To maximize subscriber acquisition and retention while maintaining low price barriers, we will employ a mix of charm pricing, decoy pricing, and anchoring.

* **Weekly Tier (New): $4.99/week**
  * *Justification:* Low cognitive load for impulse buyers. Excellent for locking in users who are hesitant about a monthly commitment after the trial.
* **Starter Tier: $9.99/month**
  * *Justification:* Retains the low barrier to entry. We limit this tier strictly (e.g., lower API calls/token allowance) to push users toward Pro.
* **Pro Tier: $19.99/month**
  * *Justification:* The "Decoy/Anchor" sweet spot. Highlighted as "Most Popular." At roughly 2x the price of Starter, it should offer 3x-4x the value (e.g., unlimited basic signals + premium tokens).
* **Elite Tier: $49.99/month**
  * *Justification:* Serves as the high-price anchor to make Pro look like a bargain, catering only to power users or professional bettors.
* **Annual Billing (New):**
  * Propose a 20% discount for annual commitment (e.g., Pro at $190/year instead of $240/year) to dramatically increase LTV and lock-in.

### 2. Funnel Optimization & Exit Pop-up Strategy

**Current Funnel Drop-offs:**
- Exit popup appears too quickly or randomly (60s or mouse exit).
- Broad "No lock-in" messaging can be confusing or lack urgency.

**Optimization:**
- **Popup Timing:** Delay popup to trigger based on scroll depth on the pricing page or when hitting a paywall/feature limit, rather than an arbitrary 60s timer.
- **Messaging:** Shift from "No lock-in" to "Cancel anytime during your trial — no charge today."
- **Upgrade Nudges:** Use the in-app `UpgradeBanner` to show personalized usage stats: "You've used 80% of your free API calls. Upgrade now to avoid interruption."

### 3. Token-Based Monetization Model

**Token Economy Design:**
Instead of hard limits, introduce "Shadow Tokens" for premium features, API calls, and advanced EV calculations.

* **Earning/Allotment:**
  * Free Tier: 50 Tokens/month
  * Starter: 200 Tokens/month
  * Pro: 1,000 Tokens/month
  * Elite: Unlimited / 5,000 Tokens
* **Consumption:**
  * Standard EV lookup: 1 Token
  * Premium deep-scan/history export: 10 Tokens
* **Top-ups:**
  * Users can buy a "Boost Pack" of 500 Tokens for $5.00. This captures revenue from heavy users without forcing them into a $49.99 tier immediately.
* **Expiration:**
  * Subscription tokens reset monthly (use-it-or-lose-it) to encourage consistent platform engagement. Purchased "Boost" tokens roll over for 90 days.

**Comparative Analysis:**
* **Subscription Model:** High revenue predictability, higher barrier to entry, moderate churn.
* **Token Model:** Lower barrier to entry, lower predictability, high variability in user spend.
* **Hybrid (Recommended):** Base subscription provides baseline token allowance, combined with top-ups. This yields high predictability *plus* upside from power users.

### 4. Financial Projections & Break-Even Modeling

**Base Assumptions:**
* Free trial users: 10,000/month
* Current Conversion Rate: 3% (300 paid users)
* Target Conversion Rate: 5% (500 paid users)
* Blended ARPU: ~$17.50
* Churn Rate: 10% monthly

**Scenarios:**
* **Conservative (Current Setup):** 3% conversion. 300 users * $17.50 = $5,250 MRR. High churn keeps LTV at ~$175.
* **Optimistic (Optimized Funnel + Decoy Pricing):** 5% conversion. 500 users * $18.50 = $9,250 MRR.
* **Hybrid Token Upside:** 5% conversion + 20% of users buy one $5 token pack/month. MRR increases to ~$9,750. Break-even on CAC (Customer Acquisition Cost) achieved 30% faster due to Day-1 token pack purchases.

### 5. A/B Testing Roadmap

**Phase 1: Funnel & Popup Mechanics (Weeks 1-2)**
* *Test A (Control):* Current 60s / Exit Intent Popup.
* *Test B (Variant):* Intent-driven Popup (triggers only on feature walls or pricing page exit).
* *Metric:* Trial sign-up conversion rate.

**Phase 2: Pricing Display & Anchoring (Weeks 3-4)**
* *Test A (Control):* Monthly pricing only.
* *Test B (Variant):* Monthly pricing + Weekly $4.99 option.
* *Metric:* Paid checkout conversion rate and day-30 retention.

**Phase 3: Hybrid Token Model (Weeks 5-8)**
* *Test A (Control):* Hard limits on Pro tier.
* *Test B (Variant):* Token allowance with top-up options.
* *Metric:* ARPU and upgrade frequency.

### 6. Risk Assessment & Legal/Compliance

* **Stripe & Subscription Compliance:** Clearly disclose trial duration and automatic billing parameters on checkout. Ensure the "Cancel anytime" UI accurately maps to Stripe customer portal behavior.
* **Token Legalities:** Tokens must have no cash value. Clearly state in Terms of Service that tokens are non-refundable digital entitlements.
* **Gambling/RG Compliance:** Keep all marketing strictly analytical ("EV Data", "Signals") rather than guaranteeing gambling profits, maintaining alignment with Responsible Gambling (RG) frameworks.

### 7. Implementation & Rollout Timeline

* **Week 1:** Update UI copy, modify `ExitPopup.tsx` and `UpgradeBanner.tsx` logic. Add weekly plan to Stripe and `server/routes/payments.js`.
* **Week 2:** Launch Phase 1 A/B tests on funnel timing.
* **Week 3:** Roll out new Weekly ($4.99) pricing tier and annual discounts.
* **Week 4-5:** Develop Token Ledger (`user_tokens` table) in `server/db/schema.sql` and API consumption middleware behind a feature flag.
* **Week 6:** Launch Phase 3 Token Hybrid model to 25% of user base. Full rollout by Week 8 based on ARPU lift.