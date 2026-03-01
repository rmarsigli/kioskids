-- Migration 002: add guardian fields to sessions
-- SQLite ALTER TABLE only supports ADD COLUMN.
-- Both columns are nullable so existing rows keep working without a data backfill.

ALTER TABLE sessions ADD COLUMN guardian_name    TEXT;
ALTER TABLE sessions ADD COLUMN guardian_contact TEXT;
