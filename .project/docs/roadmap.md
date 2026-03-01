# Execution Roadmap

## MVP — Phase 1 (90 days)
**Focus:** Deliver a fully functional offline kiosk. No backend. Validate with real clients.

**Deliverable:** A signed Windows `.exe` installer that a store owner can install on any machine and start operating immediately.

### Features
- [ ] Check-in (child name, guardian name, contact, tariff selection)
- [ ] Real-time session dashboard (live timer, current cost per child)
- [ ] Check-out with automatic billing calculation (tariff engine)
- [ ] Receipt printing via `window.print()` (HTML template → OS default printer)
- [ ] WhatsApp Deep Link notification for guardians
- [ ] Session history (today's completed sessions)
- [ ] Local tariff management (create/edit/deactivate tariffs via UI)
- [ ] SQLite sync queue (accumulates sessions for future upload)
- [ ] Auto-updater (GitHub Releases / S3)

### Commercial Model (Phase 1)
- Manual billing (Pix / bank link sent externally by developer)
- Manual block of delinquent clients (no automation yet)

### Not in Phase 1
- Backend / cloud panel
- JWT lockdown / security module
- Automatic payments
- Automatic sync

---

## Phase 2 — Stability & Cloud
**Focus:** Bring the Core Module online. Activate sync. Automate financial operations.

### Features
- [ ] Laravel 12 Core Module (basic structure + tenancy)
- [ ] Kiosk token provisioning + JWT auth
- [ ] Tariff management UI (Core web panel)
- [ ] Pull sync: kiosk downloads tariff rules from Core
- [ ] Push sync: kiosk uploads session batches to Core
- [ ] Audit engine: Core recalculates session totals
- [ ] Financial dashboard: consolidated session view per tenant
- [ ] JWT lockdown + clock anti-fraud activated on kiosk
- [ ] Laravel Cashier + Stripe for recurring SaaS billing
- [ ] Automatic kiosk lockdown via Stripe webhook (delinquent)
- [ ] Auto-updater hardened (delta updates, rollback support)
- [ ] Discounts & courtesy sessions with audit log

---

## Phase 3 — Expansion & Upsell
**Focus:** Internationalization and premium add-ons to increase ARPU.

### Features
- [ ] i18n UI: English and Spanish language support
- [ ] Multi-timezone and multi-currency display
- [ ] Premium Add-on: WhatsApp API (automated messages) via Evolution API or official Cloud API
- [ ] Parents App: real-time session monitoring via QR Code scan
- [ ] Multi-kiosk per tenant support improvements
- [ ] Advanced reporting (revenue trends, peak hours, occupancy)
