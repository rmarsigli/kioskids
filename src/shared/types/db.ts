// Shared entity types and DTOs for the local SQLite database.
// Used by Main (repositories) and exposed to Renderer through IPC result types.
// No `any` allowed — all JSON fields are typed through dedicated interfaces.

import { TariffSnapshotSchema } from '@shared/utils/tariff-engine'

export type SessionStatus = 'open' | 'closed' | 'canceled'
export type SyncStatus = 'pending' | 'synced' | 'error'

// Re-export so consumers that import from db.ts don't need a second import path.
export type { TariffSnapshot } from '@shared/utils/tariff-engine'
export type { SaveTariffDto } from '@shared/utils/tariff-schema'
export type { CheckInRequestDto } from '@shared/utils/check-in-schema'

// ---------------------------------------------------------------------------
// Tariff
// ---------------------------------------------------------------------------

/**
 * Full DB row for a tariff. Mirrors the `tariffs` table columns.
 * See tariff-engine.md for field semantics.
 */
export interface Tariff {
  id: number
  name: string
  base_price: number                  // integer cents — price for first base_minutes
  base_minutes: number                // how many minutes the base price covers
  additional_fraction_price: number   // integer cents — price per fraction of extra time
  additional_fraction_minutes: number // size of each fraction unit in minutes (>= 1)
  tolerance_minutes: number           // grace window after base_minutes before extra billing
  is_active: 0 | 1                    // SQLite boolean
  created_at: string                  // UTC ISO-8601
  updated_at: string
}

/**
 * Type-safe parse of a `Session.tariff_snapshot` JSON string.
 * Uses Zod for runtime validation — throws ZodError on malformed data.
 */
export function parseTariffSnapshot(raw: string): ReturnType<typeof TariffSnapshotSchema.parse> {
  return TariffSnapshotSchema.parse(JSON.parse(raw))
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface Session {
  id: string                     // UUID v4
  child_name: string
  guardian_name: string | null   // added in migration 002 — required from TASK-008 onwards
  guardian_contact: string | null // phone/WhatsApp, added in migration 002
  tariff_id: number
  tariff_snapshot: string        // JSON.stringify(TariffSnapshot)
  checked_in_at: string          // UTC ISO-8601
  checked_out_at: string | null
  duration_minutes: number | null
  total_cents: number | null
  notes: string | null           // populated on cancel (migration 003)
  status: SessionStatus
  sync_status: SyncStatus
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Checkout preview
// ---------------------------------------------------------------------------

/**
 * Returned by the `db:preview-checkout` handler.
 * Computed read-only — no DB writes occur.
 */
export interface PreviewCheckoutResult {
  session_id: string
  child_name: string
  guardian_name: string | null
  tariff_name: string
  checked_in_at: string
  elapsed_minutes: number
  preview_total: number  // integer cents
}

/** Payload the Renderer sends to cancel a session. */
export interface CancelSessionDto {
  id: string
  notes?: string
}

export interface CheckInDto {
  id: string              // caller provides the UUID
  child_name: string
  guardian_name?: string  // required from TASK-008; nullable here for backwards compat
  guardian_contact?: string
  tariff_id: number
}

/** Payload the Renderer sends to close a session. Main sets the timestamp. */
export interface CheckOutRequestDto {
  id: string  // UUID of the open session to close
}

export interface CheckOutDto {
  id: string
  checked_out_at: string
  duration_minutes: number
  total_cents: number
}

// ---------------------------------------------------------------------------
// SyncQueue
// ---------------------------------------------------------------------------

export interface SyncQueueEntry {
  id: number
  session_id: string
  payload: string      // JSON of the full sync payload (see api-contracts)
  attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// AppConfig
// ---------------------------------------------------------------------------

export interface AppConfig {
  key: string
  value: string
  updated_at: string
}
