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

-- ── 8. Multi-bet / Parlay tables ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS multi_bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    combined_odds DECIMAL(10,4) NOT NULL,
    combined_ev DECIMAL(8,3),
    total_stake DECIMAL(12,2) NOT NULL DEFAULT 0,
    num_legs INTEGER NOT NULL DEFAULT 2,
    max_correlation_score DECIMAL(5,4) DEFAULT 0,
    kelly_fraction DECIMAL(8,4),
    result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending','win','loss','void','cashout')),
    profit_aud DECIMAL(12,2),
    placed_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS multi_legs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    multi_id UUID REFERENCES multi_bets(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL,
    event_name VARCHAR(500),
    sport_key VARCHAR(100),
    selection VARCHAR(255) NOT NULL,
    bookie VARCHAR(100),
    odds_taken DECIMAL(10,4) NOT NULL,
    fair_odds DECIMAL(10,4),
    ev_percent DECIMAL(8,3),
    result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending','win','loss','void')),
    UNIQUE(multi_id, event_id, selection)
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_multi_bets_user ON multi_bets(user_id, placed_at DESC);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_multi_legs_multi ON multi_legs(multi_id);
EXCEPTION WHEN duplicate_table THEN NULL;
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

-- ── 9. Props infrastructure columns ─────────────────────────────────────────

-- odds_cache: point value for spreads/totals/props lines
ALTER TABLE odds_cache ADD COLUMN IF NOT EXISTS point DECIMAL(6,2);
-- odds_cache: hash for differential storage dedup
ALTER TABLE odds_cache ADD COLUMN IF NOT EXISTS odds_hash VARCHAR(32);

-- ev_opportunities: store the line for spreads/totals/props
ALTER TABLE ev_opportunities ADD COLUMN IF NOT EXISTS point DECIMAL(6,2);

-- Player tables
CREATE TABLE IF NOT EXISTS player_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id VARCHAR(100) NOT NULL,
  sport_key VARCHAR(50) NOT NULL,
  alias TEXT NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'auto',
  UNIQUE(sport_key, alias)
);
CREATE INDEX IF NOT EXISTS idx_player_mapping_lookup ON player_mapping(sport_key, lower(alias));

CREATE TABLE IF NOT EXISTS nba_players (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT,
  team_id INTEGER,
  active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nba_players_team ON nba_players(team_id);
CREATE INDEX IF NOT EXISTS nba_players_name ON nba_players(lower(first_name || ' ' || last_name));

CREATE TABLE IF NOT EXISTS nba_player_stats (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES nba_players(id),
  game_id INTEGER NOT NULL,
  game_date DATE NOT NULL,
  team_id INTEGER,
  opponent_team_id INTEGER,
  home_away CHAR(1),
  minutes DECIMAL(5,2),
  pts INTEGER,
  reb INTEGER,
  ast INTEGER,
  fg3m INTEGER,
  stl INTEGER,
  blk INTEGER,
  turnover INTEGER,
  UNIQUE(player_id, game_id)
);
CREATE INDEX IF NOT EXISTS nba_player_stats_player ON nba_player_stats(player_id, game_date DESC);
CREATE INDEX IF NOT EXISTS nba_player_stats_game ON nba_player_stats(game_id);

DO $$ BEGIN ALTER TABLE player_mapping DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE nba_players DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE nba_player_stats DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ── 10. CLV tracking table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clv_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL,
  sport_key VARCHAR(100) NOT NULL,
  event_name VARCHAR(500),
  market VARCHAR(100) NOT NULL DEFAULT 'h2h',
  selection VARCHAR(255) NOT NULL,
  bookie VARCHAR(100) NOT NULL,
  signal_odds DECIMAL(10,4) NOT NULL,
  signal_fair_odds DECIMAL(10,4) NOT NULL,
  signal_ev_percent DECIMAL(8,3) NOT NULL,
  signal_source TEXT NOT NULL DEFAULT 'consensus_v1',
  signal_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  commence_time TIMESTAMPTZ,
  closing_odds DECIMAL(10,4),
  closing_fair_odds DECIMAL(10,4),
  clv_percent DECIMAL(8,3),
  closed_at TIMESTAMPTZ,
  UNIQUE(event_id, market, selection, bookie)
);

CREATE INDEX IF NOT EXISTS idx_clv_event ON clv_tracking(event_id);
CREATE INDEX IF NOT EXISTS idx_clv_pending ON clv_tracking(commence_time)
  WHERE closed_at IS NULL;

ALTER TABLE clv_tracking DISABLE ROW LEVEL SECURITY;

-- ── 11. v2 — user_preferences, api_call_log, pulse_events ───────────────────

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id    UUID        PRIMARY KEY,
  onboarding_done   BOOLEAN     NOT NULL DEFAULT FALSE,
  email_alerts      BOOLEAN     NOT NULL DEFAULT TRUE,
  push_alerts       BOOLEAN     NOT NULL DEFAULT TRUE,
  alert_min_ev      NUMERIC(6,2) NOT NULL DEFAULT 5.0,
  default_stake_aud NUMERIC(10,2),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_call_log (
  id          BIGSERIAL   PRIMARY KEY,
  provider    TEXT        NOT NULL,
  sport_key   TEXT,
  credits_remaining BIGINT,
  called_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pulse_events (
  id          BIGSERIAL   PRIMARY KEY,
  event_type  TEXT        NOT NULL,
  event_name  TEXT,
  ev_percent  NUMERIC(6,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pulse_events_recorded_at_idx ON pulse_events (recorded_at DESC);

ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_events     DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN ALTER TABLE multi_bets DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE multi_legs DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Done.
SELECT 'Migration complete' AS status;
