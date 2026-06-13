CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free','starter','pro','elite')),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'trial',
  api_calls_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS odds_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  home_team VARCHAR(255),
  away_team VARCHAR(255),
  commence_time TIMESTAMPTZ,
  bookmaker VARCHAR(100),
  market VARCHAR(100),
  selection VARCHAR(255),
  odds DECIMAL(10,4),
  source_api VARCHAR(50),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(event_id, bookmaker, market, selection)
);

CREATE TABLE IF NOT EXISTS ev_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key VARCHAR(100),
  event_id VARCHAR(255),
  event_name VARCHAR(500),
  market VARCHAR(100),
  selection VARCHAR(255),
  bookie VARCHAR(100),
  bookie_odds DECIMAL(10,4),
  fair_odds DECIMAL(10,4),
  ev_percent DECIMAL(8,3),
  kelly_percent DECIMAL(8,4),
  commence_time TIMESTAMPTZ,
  found_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  -- Dedupe: markets feed must show a single card per (event, selection).
  -- market is always 'h2h' in current pipeline, but we include it for safety.
  UNIQUE (event_id, market, selection)
);

CREATE TABLE IF NOT EXISTS arb_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key VARCHAR(100),
  event_name VARCHAR(500),
  market VARCHAR(100),
  bookie_1 VARCHAR(100),
  selection_1 VARCHAR(255),
  odds_1 DECIMAL(10,4),
  bookie_2 VARCHAR(100),
  selection_2 VARCHAR(255),
  odds_2 DECIMAL(10,4),
  profit_percent DECIMAL(8,4),
  stake_1_percent DECIMAL(8,4),
  stake_2_percent DECIMAL(8,4),
  found_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_name VARCHAR(500),
  sport VARCHAR(100),
  market VARCHAR(100),
  selection VARCHAR(255),
  bookie VARCHAR(100),
  odds_taken DECIMAL(10,4),
  fair_odds DECIMAL(10,4),
  ev_percent DECIMAL(8,3),
  kelly_fraction DECIMAL(8,4),
  stake_aud DECIMAL(12,2),
  closing_odds DECIMAL(10,4),
  clv_percent DECIMAL(8,3),
  result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending','win','loss','void','cashout')),
  profit_aud DECIMAL(12,2),
  event_time TIMESTAMPTZ,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS api_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(100),
  endpoint VARCHAR(255),
  calls_used INTEGER DEFAULT 1,
  quota_remaining INTEGER,
  called_at TIMESTAMPTZ DEFAULT NOW(),
  month_year VARCHAR(7)
);

CREATE INDEX IF NOT EXISTS idx_odds_sport ON odds_cache(sport_key, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_odds_event ON odds_cache(event_id);
CREATE INDEX IF NOT EXISTS idx_odds_expires ON odds_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ev_active ON ev_opportunities(is_active, ev_percent DESC);
CREATE INDEX IF NOT EXISTS idx_ev_sport ON ev_opportunities(sport_key, is_active);
CREATE INDEX IF NOT EXISTS idx_arb_active ON arb_opportunities(is_active, profit_percent DESC);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_month ON api_call_log(api_name, month_year);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(255),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

ALTER TABLE ev_opportunities ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;

-- ── Historical data — backtest pipeline ─────────────────────────────────────

-- Actual match outcomes fetched from The Odds API scores endpoint
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

-- Historical odds snapshots at key windows before kickoff
-- One call per (sport, timestamp) covers all games at that moment
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
