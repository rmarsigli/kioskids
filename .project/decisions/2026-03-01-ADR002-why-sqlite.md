---
number: "002"
title: "SQLite as the local database for the Electron kiosk"
date: 2026-03-01
status: Accepted
authors: [Rafhael Marsigli]
review_date: 2026-09-01
tags: [architecture, database, sqlite, electron, offline-first]
---

# ADR-002: SQLite as the local database for the Electron kiosk

## Status

**Accepted**

Date: 2026-03-01

## Context

**The Problem:**
The Electron kiosk operates fully offline. It needs a local persistent store for: active tariff rules, session records (check-in/check-out), a sync queue, and app configuration. The choice of local database technology has significant implications for reliability, type safety, developer experience, and long-term maintainability.

**Context & Constraints:**
- Runs on Windows machines in children's stores — potentially low-spec hardware
- Must survive app restarts, machine reboots, and power loss without data corruption
- Schema must be version-controlled with automatic migration on startup
- Data must be queryable in a structured way (not just key-value)
- Solo developer — minimal operational overhead required
- Sessions must eventually be serialized and sent to a Laravel/PostgreSQL backend (ADR-001)
- `better-sqlite3` offers synchronous Node.js bindings — critical for the Electron Main process model

## Decision

**We will use SQLite via `better-sqlite3` as the local database, with a custom migration runner and the Repository Pattern for data access.**

**Rationale:**
1. **Synchronous API:** `better-sqlite3` is synchronous, which is the correct model for the Electron Main process. Async DB calls in a single-process Main thread introduce unnecessary complexity and potential deadlocks with `ipcMain.handle` flow.
2. **Zero operational overhead:** SQLite is a single file in `app.getPath('userData')`. No server process, no port, no configuration. Perfectly suited for end-client machines.
3. **Proven reliability:** SQLite is used in production by billions of devices. It handles power loss via WAL mode and atomic transactions.
4. **Schema fits the domain:** The data model (tariffs, sessions, sync queue) is relational. A relational database with foreign keys and indexes is the correct tool — not a key-value store.
5. **Sync-ready:** Session records can be serialized directly to the JSON payload shape defined in `api-contracts.md`. The `tariff_snapshot` column stores a JSON string of the tariff at check-in time, enabling correct server-side audit without schema coupling.
6. **Migration runner:** Version-controlled `.sql` migration files with an `_migrations` table ensure reproducible schema evolution across all installed client machines.
7. **TypeScript integration:** `@types/better-sqlite3` provides full type coverage. Combined with the Repository Pattern and typed interfaces from `src/shared/types/`, there is no `any` in the data layer.

## Alternatives Considered

### Option A: IndexedDB (browser-side storage)

**Pros:**
- No native Node module required
- Runs in the Renderer process natively

**Cons:**
- Non-relational — complex queries require manual joins in JavaScript
- Not accessible from the Main process — violates the architecture (Main handles all data)
- No transactions in the SQL sense
- Cannot be easily migrated between schema versions
- Data lives in the browser profile folder — harder to backup and inspect

**Rejected because:** Fundamentally wrong process isolation. Data access belongs in Main, not Renderer. IndexedDB is browser-only and non-relational.

### Option B: LevelDB / lowdb (key-value stores)

**Pros:**
- Simple API
- Pure JavaScript (no native binaries)

**Cons:**
- No relational queries — joining sessions to tariffs requires manual code
- No transactions — data integrity at risk on power loss
- No schema enforcement — any shape can be written, leading to data corruption bugs

**Rejected because:** The domain is relational (sessions reference tariffs, sync queue references sessions). Key-value stores would require manual join logic and lose data integrity guarantees.

### Option C: Prisma + SQLite

**Pros:**
- Full ORM with type-safe query builder
- Migration system included

**Cons:**
- Prisma requires a query engine binary — significantly increases installer size and complexity
- Known compatibility issues with Electron packaging (`electron-builder` often breaks Prisma's binary resolution)
- Overhead and abstraction not justified for a schema with 4 tables
- Adds a `prisma generate` step to the build pipeline

**Rejected because:** The benefit of a full ORM is not proportionate to the complexity it adds for 4 tables. `better-sqlite3` with a thin Repository layer achieves the same type safety with far less friction.

### Option D: Drizzle ORM + SQLite

**Pros:**
- Type-safe query builder with no code generation step
- Schema defined in TypeScript
- Works well with `better-sqlite3`

**Cons:**
- Adds a dependency and a layer of abstraction
- Migration story requires `drizzle-kit`, adding build tooling
- For 4 tables, the benefit over plain SQL is marginal

**Rejected because (for now):** Plain `better-sqlite3` with hand-written SQL and a Repository Pattern is more transparent and easier to reason about for a small schema. This decision can be revisited (superseded by a new ADR) if the schema grows significantly in Phase 2+.

## Consequences

### Positive
- [x] Zero server infrastructure on client machines
- [x] Synchronous API simplifies Main process handler code
- [x] Migration runner guarantees schema consistency across all deployed clients
- [x] Full type safety via Repository Pattern + shared TypeScript interfaces
- [x] Single `.db` file is trivially backupable

### Negative
- [x] Native binary (`better-sqlite3`) must be rebuilt for the target Electron version during packaging
  - Mitigation: `electron-builder` handles this via `--rebuild` flag; configured in T001.
- [ ] If schema grows beyond ~15 tables in Phase 2+, a query builder (Drizzle) may become beneficial
  - Mitigation: A new ADR will be created at that point.

### Neutral
- All timestamps stored as UTC ISO 8601 text strings (SQLite has no native datetime type) — consistent with the i18n-from-day-1 principle

## Implementation

**Key schema decisions:**
- `tariff_snapshot` stored as `TEXT` (JSON) on the `sessions` table — decouples session audit from tariff mutations
- All monetary values as `INTEGER` (cents) — no `REAL` columns for money
- Boolean columns as `INTEGER` (0/1) — SQLite has no native boolean
- All primary keys are UUIDs (`TEXT`) — compatible with the Core's PostgreSQL schema without collision

**WAL mode:** Enable Write-Ahead Logging on connection open for better concurrent read performance and crash recovery:
```typescript
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```

## Validation

**Success Criteria:**
- [ ] Zero data loss events in Phase 1 client deployments
- [ ] Migration runner applies all migrations idempotently on every tested machine
- [ ] Sync queue correctly carries all sessions to Phase 2 backend without data loss

**Review Date:** 2026-09-01

Review if: Schema grows beyond 10 tables, or if query complexity justifies a query builder.

## Related

**Depends on:**
- ADR-001 (Electron-first strategy makes local DB essential)

**Impacts:**
- T002 (Database Layer task implements this decision)
- [Architecture Guidelines](../docs/architecture.md) — SQLite Schema Responsibilities section
- [API Contracts](../docs/api-contracts.md) — `tariff_snapshot` shape consumed by Core audit engine

## References

- [better-sqlite3 docs](https://github.com/WiseLibs/better-sqlite3)
- [SQLite WAL mode](https://www.sqlite.org/wal.html)
- [Architecture Guidelines](../docs/architecture.md)

## Approval

**Decided by:** Rafhael Marsigli
**Date:** 2026-03-01
**Status:** Accepted

---

**Version:** 1.0
**Last Updated:** 2026-03-01
