---
title: "Database Layer — SQLite + Migration Runner + Schema"
created: 2026-03-01T21:22:20.464Z
priority: P1-M
status: backlog
tags: [feat]
---

# Database Layer — SQLite + Migration Runner + Schema

better-sqlite3 singleton connection in src/main/database/. Custom migration runner: reads numbered .sql files from migrations/sql/, tracks applied migrations in _migrations table, wraps each in a transaction, halts startup on failure. Schema: tariffs, sessions (with tariff_snapshot TEXT/JSON), sync_queue, app_config. WAL mode + foreign_keys ON. Seed default tariff on first run. Repository Pattern base directory. Depends on T001.

