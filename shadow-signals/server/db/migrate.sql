-- ─────────────────────────────────────────────────────────────────────────────
-- Shadow Signals — incremental migration
-- Run once against the live DB. Safe to re-run (all ops are idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Ensure UNIQUE constraints exist (fixes ON CONFLICT cron errors) ───────
--
-- CREATE TABLE IF NOT EXISTS doesn't backfill constraints added after initial
-- deploy. The ON CONFLICT clauses in evCalculator.js and cacheManager.js will
-- throw "no unique constraint matching" until these exist on the live table.

DO $$ BEGIN
  ALTER TABLE ev_opportunities
    ADD CONSTRAINT ev_opportunities_event_id_market_selection_key
    UNIQUE (event_id, market, selection);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE odds_cache
    ADD CONSTRAINT odds_cache_event_id_bookmaker_market_selection_key
    UNIQUE (event_id, bookmaker, market, selection);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Missing FK indexes ────────────────────────────────────────────────────
--
-- bets.user_id is already indexed (idx_bets_user). notifications.user_id is
-- indexed too. These are the remaining unindexed FK columns in our schema.

CREATE INDEX IF NOT EXISTS idx_bets_user_id
  ON bets(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);

-- ── 3. EV opportunities — add event_id index for /api/games join ─────────────

CREATE INDEX IF NOT EXISTS idx_ev_event_id
  ON ev_opportunities(event_id, is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_odds_commence
  ON odds_cache(commence_time)
  WHERE expires_at > NOW();

-- ── 4. RLS — our app connects as the DB owner (BYPASSRLS) via DATABASE_URL.  ─
--  We don't use Supabase PostgREST or anon/authenticated roles, so RLS on    --
--  these tables doesn't currently block the app — but enabled RLS with no    --
--  policies is a future footgun. Disable it explicitly on our app tables so  --
--  the linter stops warning and intent is unambiguous.                        --

ALTER TABLE bets             DISABLE ROW LEVEL SECURITY;
ALTER TABLE ev_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE odds_cache       DISABLE ROW LEVEL SECURITY;
ALTER TABLE arb_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_log     DISABLE ROW LEVEL SECURITY;

-- ── 5. alert_sent column — ensure it exists (added via ALTER in schema.sql) ──

ALTER TABLE ev_opportunities
  ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;

-- ── 6. users — useful indexes that may be missing ───────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_plan
  ON users(plan, subscription_status);

-- Done.
SELECT 'Migration complete' AS status;
