-- Migration 005: link sessions to the optional customer record.
-- SQLite ALTER TABLE supports ADD COLUMN for nullable columns without a 12-step rename.
-- NULL means the session was created without a linked customer (backwards compat).

ALTER TABLE sessions ADD COLUMN customer_id TEXT REFERENCES customers(id);

CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON sessions (customer_id);
