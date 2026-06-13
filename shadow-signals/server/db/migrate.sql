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

-- ── 7. Historical backtest tables ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  sport_key VARCHAR(100) NOT NULL,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  home_score NUMERIC(8,2),
  away_score NUMERIC(8,2),
  winner VARCHAR(10) CHECK (winner IN ('home','away','draw')),
  completed BOOLEAN DEFAULT FALSE,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historical_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL,
  sport_key VARCHAR(100) NOT NULL,
  snapshot_time TIMESTAMPTZ NOT NULL,
  bookmaker VARCHAR(100) NOT NULL,
  market VARCHAR(50) NOT NULL DEFAULT 'h2h',
  selection VARCHAR(255) NOT NULL,
  odds DECIMAL(10,4) NOT NULL,
  hours_before_kickoff DECIMAL(8,2),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, snapshot_time, bookmaker, market, selection)
);

CREATE INDEX IF NOT EXISTS idx_game_results_sport ON game_results(sport_key, completed);
CREATE INDEX IF NOT EXISTS idx_game_results_time ON game_results(commence_time DESC);
CREATE INDEX IF NOT EXISTS idx_hist_odds_event ON historical_odds(event_id);
CREATE INDEX IF NOT EXISTS idx_hist_odds_sport_snap ON historical_odds(sport_key, snapshot_time DESC);

ALTER TABLE game_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE historical_odds DISABLE ROW LEVEL SECURITY;

-- ── 8. Model engine columns + RLS ───────────────────────────────────────────

ALTER TABLE ev_opportunities
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'consensus_v1';
ALTER TABLE ev_opportunities
  ADD COLUMN IF NOT EXISTS model_confidence NUMERIC(5,4);

DO $$ BEGIN ALTER TABLE afl_teams DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE afl_results DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE afl_fixtures DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE afl_power_ratings DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE afl_predictions DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE nba_teams DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE nba_results DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE nba_fixtures DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE nba_power_ratings DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE nba_predictions DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE model_runs DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Done.
SELECT 'Migration complete' AS status;
