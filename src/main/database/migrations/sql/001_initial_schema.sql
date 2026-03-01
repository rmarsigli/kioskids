-- Migration 001: initial schema
-- WAL mode and foreign_keys are enabled at the connection level (connection.ts),
-- not per migration. Each migration is wrapped in a transaction by the runner.

CREATE TABLE IF NOT EXISTS tariffs (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  name                 TEXT    NOT NULL,
  price_per_minute     INTEGER NOT NULL CHECK (price_per_minute >= 0),
  grace_period_minutes INTEGER NOT NULL DEFAULT 0 CHECK (grace_period_minutes >= 0),
  rounding_minutes     INTEGER NOT NULL DEFAULT 1 CHECK (rounding_minutes >= 1),
  is_active            INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at           TEXT    NOT NULL,
  updated_at           TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id               TEXT    PRIMARY KEY,
  child_name       TEXT    NOT NULL,
  tariff_id        INTEGER NOT NULL REFERENCES tariffs(id),
  tariff_snapshot  TEXT    NOT NULL,
  checked_in_at    TEXT    NOT NULL,
  checked_out_at   TEXT,
  duration_minutes INTEGER,
  total_cents      INTEGER,
  status           TEXT    NOT NULL DEFAULT 'open'    CHECK (status IN ('open', 'closed')),
  sync_status      TEXT    NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_status         ON sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_sync_status    ON sessions (sync_status);
CREATE INDEX IF NOT EXISTS idx_sessions_checked_in_at  ON sessions (checked_in_at);

CREATE TABLE IF NOT EXISTS sync_queue (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT    NOT NULL REFERENCES sessions(id),
  payload    TEXT    NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_session_id ON sync_queue (session_id);

CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
