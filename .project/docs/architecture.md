# Architecture Guidelines

KiosKids follows a **Hybrid Architecture**: a Modular Monolith backend (Core) paired with an Electron desktop kiosk (Satellite). Both modules are developed and shipped independently, in sequence.

---

## Development Phases

### Phase 1 — Electron Satellite Only (current)

The Electron app is the **entire product** in this phase. No backend exists. Tariff rules are seeded locally (via a JSON import or hardcoded defaults for MVP). Sessions are stored in SQLite and queued for future sync.

**Security in Phase 1:** JWT lockdown does NOT apply. The kiosk operates freely. Anti-fraud and billing security mechanisms are activated in Phase 2 when the backend is online.

### Phase 2+ — Core Module + Sync

The Laravel backend comes online. The kiosk begins pulling tariff rules and pushing sessions. Security module activates.

---

## 1. Core Module (Backend / Cloud) — Phase 2+

Developed in Laravel 12. This is the global management hub and source of financial truth.

- **Tenancy:** Scoped by Tenant — logical data isolation per client (store). Each kiosk belongs to one tenant.
- **Tariff Management:** CRUD for tariff rules. Rules are versioned — old sessions always reference the tariff version active at check-in time.
- **Financial Dashboard:** Consolidated view of synced sessions per kiosk, per day, per period.
- **Kiosk Token Management:** Issues and revokes JWT tokens for physical machines.
- **Audit Engine:** When a sync payload arrives, the Core independently recalculates `calculated_total` from raw `check_in_at` + `check_out_at` + the stored tariff at that time. Discrepancies are flagged.
- **Payments (Phase 2.x):** Laravel Cashier + Stripe for recurring SaaS billing. Webhooks trigger automatic kiosk lockdown for delinquent tenants.
- **i18n:** Multi-language (PT/EN/ES), multi-currency, timezone-aware. All DB values in UTC and cents.

**Stack:**
- PHP 8.4+ / Laravel 12 — Modular Monolith
- React + Inertia.js (web dashboard)
- Spatie Laravel Data (DTOs + validation)
- PostgreSQL (primary database)
- Hetzner Cloud ARM64 via Laravel Forge
- CI/CD: GitHub Actions → Pest PHP tests → deploy

---

## 2. Satellite Module (Electron / "Dumb Client") — Phase 1

The Electron kiosk handles all shop-floor operations. It has zero dependency on the network during normal use.

### Process Isolation (mandatory)

```
Renderer (React/Vite)
    ↓  window.api.*  (only via contextBridge)
Preload (Context Bridge)
    ↓  ipcRenderer.invoke()
Main Process (Node.js / Electron)
    ↓
SQLite / Hardware / OS APIs
```

- The Renderer **never** accesses Node.js APIs directly.
- All DB reads/writes, file system access, printing, and OS calls are handled in `Main` and exposed via typed IPC channels.
- IPC channel naming convention: `domain:action` (e.g., `db:get-active-sessions`, `hw:print-receipt`, `sync:push-sessions`).
- IPC handlers must return serialized, typed result objects — never throw raw Node errors across the bridge.

### SQLite Schema Responsibilities

- `tariffs` — mirror of active tariff rules (seeded locally in Phase 1, synced from Core in Phase 2+)
- `sessions` — all check-in/check-out records with full audit fields
- `sync_queue` — sessions pending upload to Core
- `app_config` — kiosk metadata, last sync timestamp, JWT token (Phase 2+)

### Printing

Receipts are generated as HTML templates in the Renderer and dispatched via `window.print()`. This uses the OS default printer (plug-and-play, no thermal driver integration required). The Main process has no role in printing — it is pure renderer-side.

### Auto-Update (Phase 1.x)

Silent auto-updater using `electron-updater`. Update artifacts (YAML manifest + installer) are hosted on GitHub Releases or AWS S3 / Cloudflare R2. The updater checks on app start and applies updates silently in the background.

### CI/CD

GitHub Actions pipeline:
1. Install dependencies (`pnpm install`)
2. Run unit tests (Vitest)
3. Build Electron app (`electron-builder`)
4. Publish release artifact (`.exe` installer for Windows)

---

## 3. Security & Compliance Module — Phase 2+

These mechanisms enforce SaaS subscription compliance. They are activated only after the backend is live.

- **JWT Token:** The kiosk stores an encrypted JWT from the Core with an expiration date (e.g., 7 days renewable on each sync).
- **Offline Lockdown:** If the kiosk goes >7 days without successfully syncing (and thus renewing the token), the screen locks and blocks all operations until connectivity is restored.
- **Clock Anti-Fraud:** The Main process monitors system clock. If the OS date moves backwards (roll-back manipulation attempt), the kiosk locks immediately and logs the event.
- **Manual Delinquency Block:** In Phase 2, Stripe webhooks notify the Core, which sets `kiosk.status = blocked`. On next sync, the kiosk downloads this status and locks itself.

---

## 4. Internationalization (i18n) — from Day 1

Even though the MVP targets Brazilian Portuguese, the data layer must be i18n-ready:

| Concern | Rule |
|---|---|
| Monetary values | Always stored as **integers in cents** (e.g., R$ 30,00 → `3000`) |
| Timestamps | Always stored and transmitted as **UTC ISO 8601** |
| Timezones | Applied at display layer only; never baked into stored data |
| Language strings | UI labels must use i18n keys (React `i18next` or equivalent) from the start |
| Number formatting | Locale-aware formatting at render time only |