---
number: "001"
title: "Electron-First — Build and validate the desktop kiosk before the cloud API"
date: 2026-03-01
status: Accepted
authors: [Rafhael Marsigli]
review_date: 2026-09-01
tags: [architecture, strategy, electron, api, offline-first]
---

# ADR-001: Electron-First — Build and validate the desktop kiosk before the cloud API

## Status

**Accepted**

Date: 2026-03-01

## Context

**The Problem:**
KiosKids is a two-module system: an Electron desktop kiosk (Satellite) and a Laravel cloud backend (Core). Both cannot be built simultaneously by a single developer within a 90-day MVP window without compromising quality in both. A sequencing decision must be made.

**Context & Constraints:**
- Solo developer — parallel development of two full applications is not viable
- 90-day MVP deadline with real clients waiting to validate the product
- The core value proposition is offline resilience — the kiosk must work without internet by definition
- The cloud backend adds value only after local operation is proven correct (billing accuracy, UX, operator flows)
- Revenue from the SaaS subscription model requires the kiosk to work in production first before cloud features justify the backend cost
- The Satellite is the product the client physically interacts with daily; the Core is a management and sync layer

## Decision

**We will build and ship the Electron kiosk first, fully offline, and begin the Laravel Core only after the kiosk is validated with real clients.**

**Rationale:**
1. **Risk reduction:** The most uncertain part of the product is whether the local billing engine and operator UX are correct. Validating this with real operators before building sync infrastructure avoids building a backend that syncs the wrong data.
2. **Offline-first is not a feature — it is the architecture:** The kiosk must operate at 100% without the internet by design. Building the Core first would create pressure to couple the kiosk to network availability, undermining the core promise.
3. **Faster real-world feedback:** A working `.exe` installer can be deployed to clients in 90 days. A cloud API with no kiosk delivers nothing tangible.
4. **Simpler scope per phase:** Each phase has a single deliverable. Phase 1 = kiosk works offline. Phase 2 = kiosk syncs to cloud. This prevents scope creep across both modules simultaneously.
5. **The sync contract is defined upfront:** API contracts (`api-contracts.md`) and shared TypeScript interfaces (`src/shared/`) are documented now so the kiosk is built sync-ready — the queue exists, the payload shape is locked — but the actual HTTP calls are deferred.

## Alternatives Considered

### Option A: Build Core and Satellite in parallel

**Pros:**
- Both modules ready at the same time
- Backend-driven validation from day 1

**Cons:**
- Doubles the engineering surface for a solo developer
- Risk of the kiosk UI being designed around backend availability instead of offline resilience
- If the backend is delayed, the kiosk is also delayed

**Rejected because:** Not feasible for a solo developer in 90 days, and conflicts with the offline-first architecture principle.

### Option B: Build Core first, then Electron client

**Pros:**
- Backend defines the data model first
- Web dashboard available earlier

**Cons:**
- Delivers zero value to the end client (store operators) until Phase 2
- Forces the kiosk to be built against a live API, making offline operation an afterthought
- Validates the wrong assumption first (cloud dashboard has less risk than local billing accuracy)

**Rejected because:** Inverts the risk profile. The riskiest and most valuable assumption is whether local billing and operator UX are correct — that must be validated first.

## Consequences

### Positive
- [x] Faster time to first real-world validation with paying clients
- [x] Offline-first architecture is enforced structurally, not just as a policy
- [x] SQLite schema and sync queue designed correctly from the start (informed by real usage)
- [ ] Phase 2 backend built on validated data shapes (expected)

### Negative
- [x] No cloud dashboard or remote monitoring in Phase 1 — store owner cannot see data remotely
- Mitigation: Explicitly scoped out of MVP. Clients are informed. Local session history is available.
- [x] Manual billing (Pix) in Phase 1 — no automated subscription enforcement
- Mitigation: Acceptable for MVP. Automated billing is Phase 2.

### Neutral
- The Core module architecture (Laravel, Spatie Data, PostgreSQL) is fully designed and documented during Phase 1, so Phase 2 starts with a clear blueprint

## Validation

**Success Criteria:**
- [ ] At least one real client operating the kiosk offline for 30+ days before Phase 2 begins
- [ ] Zero session data loss during Phase 1 (all data in SQLite, backed up manually if needed)
- [ ] Operator feedback collected to inform Phase 2 UX decisions

**Review Date:** 2026-09-01

Review if: A critical business reason emerges requiring cloud features before the kiosk is validated.

## Related

**Impacts:**
- ADR-002 (SQLite choice is a direct consequence of this decision)
- [Roadmap](../docs/roadmap.md)
- [Architecture Guidelines](../docs/architecture.md) — Phase 1 vs Phase 2 section

## References

- [docs/README.md](../docs/README.md)
- [Roadmap](../docs/roadmap.md)
- [API Contracts](../docs/api-contracts.md) — defined now, implemented in Phase 2

## Approval

**Decided by:** Rafhael Marsigli
**Date:** 2026-03-01
**Status:** Accepted

---

**Version:** 1.0
**Last Updated:** 2026-03-01
