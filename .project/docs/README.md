# KiosKids — Project Documentation

**KiosKids** is a Resilient and Offline-First time-management and billing platform designed for children's entertainment spaces (brinquedotecas, trampoline parks, kids clubs). It eliminates internet dependency, human calculation errors, and cash leakage by running a full billing engine locally and syncing passively to the cloud.

---

## Architecture Overview

The project follows a **Hybrid Architecture**: a Laravel Core Module (cloud) + an Electron Satellite Module (desktop kiosk). They are **developed sequentially** — the Desktop client ships first and operates fully without the backend.

```
Phase 1 (current): Electron Kiosk — 100% offline, no backend required
Phase 2+:          Laravel Core — adds cloud sync, financial dashboard, auto-billing
```

### Desktop Client (Satellite Module) — Phase 1
- **Engine:** Electron + React (Vite) + TypeScript
- **Process Isolation:** Strict Main / Preload / Renderer separation
- **Local Database:** SQLite (tariff rules + sessions + sync queue)
- **Printing:** OS-native via `window.print()` (HTML receipt → default printer)
- **WhatsApp:** Deep Link (`whatsapp://send?...`) for manual parent notifications
- **Auto-Update:** Silent updater via GitHub Releases / S3
- **CI/CD:** GitHub Actions → build + test + package `.exe`

### Backend (Core Module) — Phase 2+

> **Developed AFTER the Desktop client is validated with real clients (100% offline).**

- **Framework:** PHP 8.4+ / Laravel 12
- **Architecture:** Modular Monolith
- **Web Frontend (Dashboard):** React + Inertia.js
- **DTOs & Validation:** Spatie Laravel Data
- **Database:** PostgreSQL (multi-tenant, logical isolation by tenant)
- **Hosting:** Hetzner Cloud (ARM64) via Laravel Forge
- **Payments:** Laravel Cashier + Stripe (Phase 2)
- **i18n:** Multi-currency, multi-language (PT/EN/ES), timezone-aware from day 1

---

## Design Philosophy

1. **Offline-First:** The kiosk never blocks on a network request. SQLite is the sole source of truth during operation.
2. **Dumb Client:** The Electron app obeys rules downloaded from the Core. It does not invent business logic — it executes it.
3. **Passive Sync:** Sessions accumulate in a local queue and are dispatched as JSON batches when connectivity is restored.
4. **Auditability:** When the Core receives a sync payload, it independently recalculates session values from raw timestamps to detect any local discrepancies.
5. **i18n from Day 1:** All monetary values stored in **cents (integer)**. All timestamps stored in **UTC ISO 8601**. Locale applied only at presentation layer.

---

## 📂 Document Index

### Architecture & Contracts
- [Architecture Guidelines](./architecture.md)
- [API & Sync Contracts](./api-contracts.md)
- [Tariff Engine — Business Logic](./tariff-engine.md)

### Features
- [Satellite Module Features](./features/satellite.md)

### Planning
- [Execution Roadmap](./roadmap.md)

### Guides
- [ADR Guide](./adr-guide.md)
- [Basic Usage](./basic-usage.md)