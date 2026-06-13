-- 2026-06 v2 migration — user_preferences, api_call_log columns, pulse table
-- Safe to re-run (all ops idempotent).

-- User preferences (onboarding flag, notification settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id    UUID        PRIMARY KEY,
  onboarding_done   BOOLEAN     NOT NULL DEFAULT FALSE,
  email_alerts      BOOLEAN     NOT NULL DEFAULT TRUE,
  push_alerts       BOOLEAN     NOT NULL DEFAULT TRUE,
  alert_min_ev      NUMERIC(6,2) NOT NULL DEFAULT 5.0,
  default_stake_aud NUMERIC(10,2),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure api_call_log exists (for quota tile)
CREATE TABLE IF NOT EXISTS api_call_log (
  id          BIGSERIAL   PRIMARY KEY,
  provider    TEXT        NOT NULL,
  sport_key   TEXT,
  credits_remaining BIGINT,
  called_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pulse table for Market Pulse panel histogram (60-second rolling window)
CREATE TABLE IF NOT EXISTS pulse_events (
  id          BIGSERIAL   PRIMARY KEY,
  event_type  TEXT        NOT NULL,  -- 'scan' | 'edge'
  event_name  TEXT,
  ev_percent  NUMERIC(6,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index so cleanup is fast
CREATE INDEX IF NOT EXISTS pulse_events_recorded_at_idx ON pulse_events (recorded_at DESC);

-- Add onboarding_done column to users if migrating from old schema
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
