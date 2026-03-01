---
title: "Tariff Management — CRUD + Local SQLite UI"
created: 2026-03-01T21:22:44.033Z
priority: P1-M
status: backlog
tags: [feat]
---

# Tariff Management — CRUD + Local SQLite UI

TariffRepository (getAll, getActive, getById, save, deactivate/soft-delete) using better-sqlite3 prepared statements. Wire db:save-tariff and db:delete-tariff IPC handlers. Zod schema for tariff validation (all fields positive integers, fraction_minutes >= 1). Currency utilities: rsToCents() and centsToRs() in src/shared/utils/currency.ts. TariffsPage: list of TariffCard components + TariffForm (inline, controlled, validation on blur, currency mask display). Cannot deactivate last active tariff. Toast on success/error. Depends on T004 and T005.

