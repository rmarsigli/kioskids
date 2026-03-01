# Feature Spec: Satellite Module (Electron Kiosk)

The Satellite Module is the entire product in Phase 1. It runs entirely offline. Every feature below must work without any network connection.

---

## F-01 — Check-In

**Objective:** Register a child's entry in the store with the minimum required information, quickly.

**Business Rules:**
1. Required fields: `child_name`, `guardian_name`, `guardian_contact`
2. Operator must select an active tariff at check-in time
3. `check_in_at` is captured from the local system clock at the exact moment of confirmation
4. A session begins in `active` status immediately
5. Multiple simultaneous active sessions are allowed (one per child)
6. The tariff active at check-in time must be snapshotted and stored with the session — it must not change if the operator edits tariffs later

**User Stories:**
- As an **operator**, I want to register a child's entry in under 10 seconds so that the queue doesn't build up
- As an **operator**, I want to capture guardian contact so I can send a WhatsApp notification when the time is nearly up

**Edge Cases:**
- Operator clicks "Check-In" twice by mistake → session must not be duplicated (debounce on submit)
- System clock is not set correctly → timestamps will be wrong but the kiosk continues operating; this is a user/hardware responsibility

---

## F-02 — Active Sessions Dashboard (Cronômetro)

**Objective:** Show all active sessions in real-time with elapsed time and projected cost.

**Business Rules:**
1. Each active session card displays: child name, guardian name, elapsed time (HH:MM:SS), current calculated cost
2. Elapsed time updates every second (live timer)
3. Projected cost recalculates every minute using the tariff engine
4. Sessions are sorted by check-in time (oldest first) by default
5. A visual alert triggers when a session has exceeded `base_minutes + tolerance_minutes` (i.e., additional charging has begun)

**User Stories:**
- As an **operator**, I want to see all active children at a glance so I can identify who has been there the longest
- As an **operator**, I want a visual indicator when a child's time has exceeded the base package so I can inform the guardian

**Edge Cases:**
- App is closed and reopened mid-session → timers must resume correctly from `check_in_at` stored in SQLite (do NOT use in-memory timer state as source of truth)
- Machine sleeps → timer must recalculate from stored `check_in_at` on wakeup, not from last visible tick

---

## F-03 — Check-Out & Billing

**Objective:** Close a session, calculate the final charge, and present it to the operator.

**Business Rules:**
1. `check_out_at` is captured from local system clock at confirmation
2. Final total is calculated using the Tariff Engine (see [tariff-engine.md](../tariff-engine.md))
3. The calculation uses the **tariff snapshot stored at check-in** — never the current active tariff
4. Operator must confirm the displayed total before the session is closed
5. Session moves to `completed` status and is added to the sync queue
6. Payment method is NOT tracked in Phase 1 (cash/Pix is handled externally by operator)

**User Stories:**
- As an **operator**, I want the system to tell me exactly how much to charge so I don't have to calculate manually
- As an **operator**, I want to confirm the total before closing so I can correct any error

**Edge Cases:**
- Operator checks out a session that's still within tolerance → system should charge only the base price
- Operator tries to check out a session with `check_out_at` < `check_in_at` → must be prevented with a validation error

---

## F-04 — Receipt Printing

**Objective:** Print a receipt for the guardian after check-out.

**Business Rules:**
1. Receipt is generated as an HTML template in the Renderer
2. Dispatched via `window.print()` — uses the OS default printer
3. Receipt contains: store name, child name, guardian name, check-in time, check-out time, duration, tariff name, total charged
4. Times on the receipt are displayed in the **local timezone** (presentation layer)
5. Printing is optional — operator can skip it

**User Stories:**
- As a **guardian**, I want a receipt so I know I was charged the correct amount

**Technical Constraints:**
- No thermal printer SDK / driver integration — plug-and-play only
- The Main process has no involvement in printing

---

## F-05 — WhatsApp Deep Link Notification

**Objective:** Allow the operator to send a pre-filled WhatsApp message to the guardian with one click.

**Business Rules:**
1. Link format: `whatsapp://send?phone={guardian_contact}&text={encoded_message}`
2. Default message template: "Olá {guardian_name}, a sessão de {child_name} está ativa há {elapsed_time}. O saldo atual é R$ {current_cost}."
3. The link opens WhatsApp Desktop or WhatsApp Web (browser fallback)
4. This is a manual action — the operator clicks "Notificar" on an active session card
5. No automatic sending in Phase 1

**User Stories:**
- As an **operator**, I want to notify a guardian with one click so I don't have to type their number manually

**Edge Cases:**
- Guardian contact is not a valid WhatsApp number → WhatsApp will handle this gracefully (no error in the app)
- WhatsApp is not installed → OS opens browser with `wa.me` fallback URL

---

## F-06 — Session History

**Objective:** Let the operator review past sessions for the current day.

**Business Rules:**
1. Shows all `completed` and `canceled` sessions from today (local date)
2. Displays: child name, check-in time, check-out time, duration, total charged, tariff used
3. Filtering by date range is a Phase 2 feature
4. No editing of completed sessions — cancellation creates a new `canceled` record with a reference to the original

**User Stories:**
- As an **operator**, I want to review today's sessions so I can reconcile the cash register at end of day

---

## F-07 — Tariff Management (Phase 1 — Local Seed)

**Objective:** Allow the operator to view and configure tariff rules locally (no backend needed).

**Business Rules:**
1. In Phase 1, tariffs are managed directly in SQLite via a simple UI
2. At least one tariff must exist and be marked as `active` at all times
3. Changing a tariff does NOT retroactively affect existing sessions (tariff is snapshotted at check-in)
4. In Phase 2+, tariffs are read-only in the kiosk — they are managed in the Core and synced down

**Fields per tariff:** `name`, `base_price` (cents), `base_minutes`, `additional_fraction_price` (cents), `additional_fraction_minutes`, `tolerance_minutes`

---

## F-08 — Sync Queue (Background, Phase 1 preparation)

**Objective:** Accumulate completed sessions in a queue ready to be dispatched to the Core when the backend becomes available.

**Business Rules:**
1. Every `completed` or `canceled` session is added to `sync_queue` with `status = pending`
2. In Phase 1, nothing is dispatched (no backend) — the queue just grows
3. In Phase 2, a background process in Main polls the queue and dispatches batches when network is available
4. Successfully synced sessions are marked `status = synced`
5. Failed sessions are marked `status = failed` with error details — they are retried on next sync attempt

**User Stories:**
- As a **business owner**, I want my offline session data to automatically upload to the cloud when internet is restored so I never lose data
