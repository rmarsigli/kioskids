-- Migration 003: extend sessions with 'canceled' status and an optional notes column.
--
-- SQLite does not support ALTER TABLE ... MODIFY COLUMN, so we use the recommended
-- 12-step table-rename procedure. Note: PRAGMA foreign_keys only affects DML
-- (INSERT/UPDATE/DELETE), not DDL — DROP TABLE and ALTER TABLE RENAME are safe to
-- run while foreign_keys = ON inside a transaction.

CREATE TABLE sessions_new (
  id               TEXT    PRIMARY KEY,
  child_name       TEXT    NOT NULL,
  guardian_name    TEXT,
  guardian_contact TEXT,
  tariff_id        INTEGER NOT NULL REFERENCES tariffs(id),
  tariff_snapshot  TEXT    NOT NULL,
  checked_in_at    TEXT    NOT NULL,
  checked_out_at   TEXT,
  duration_minutes INTEGER,
  total_cents      INTEGER,
  notes            TEXT,
  status           TEXT    NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'closed', 'canceled')),
  sync_status      TEXT    NOT NULL DEFAULT 'pending'
                           CHECK (sync_status IN ('pending', 'synced', 'error')),
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL
);

INSERT INTO sessions_new
  SELECT id, child_name, guardian_name, guardian_contact, tariff_id,
         tariff_snapshot, checked_in_at, checked_out_at, duration_minutes,
         total_cents, NULL AS notes, status, sync_status, created_at, updated_at
    FROM sessions;

DROP TABLE sessions;

ALTER TABLE sessions_new RENAME TO sessions;

CREATE INDEX IF NOT EXISTS idx_sessions_status        ON sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_sync_status   ON sessions (sync_status);
CREATE INDEX IF NOT EXISTS idx_sessions_checked_in_at ON sessions (checked_in_at);
