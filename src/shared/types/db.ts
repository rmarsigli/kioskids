// Shared entity types and DTOs for the local SQLite database.
// Used by Main (repositories) and exposed to Renderer through IPC result types.
// No `any` allowed — all JSON fields are typed through dedicated interfaces.

export type SessionStatus = 'open' | 'closed'
export type SyncStatus = 'pending' | 'synced' | 'error'

// ---------------------------------------------------------------------------
// Tariff
// ---------------------------------------------------------------------------

export interface Tariff {
  id: number
  name: string
  price_per_minute: number       // integer cents (e.g. 50 = R$0,50/min)
  grace_period_minutes: number   // free minutes at start of session
  rounding_minutes: number       // round billable time up to nearest N minutes
  is_active: 0 | 1               // SQLite boolean
  created_at: string             // UTC ISO-8601
  updated_at: string
}

/**
 * Immutable snapshot of a Tariff captured at session check-in.
 * Stored as JSON TEXT in sessions.tariff_snapshot.
 * Enables correct server-side audit even if the tariff changes later.
 */
export interface TariffSnapshot {
  id: number
  name: string
  price_per_minute: number
  grace_period_minutes: number
  rounding_minutes: number
}

/**
 * Type-safe parse of a `Session.tariff_snapshot` JSON string.
 * Use this instead of bare `JSON.parse` to keep callers honest.
 */
export function parseTariffSnapshot(raw: string): TariffSnapshot {
  return JSON.parse(raw) as TariffSnapshot
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface Session {
  id: string                     // UUID v4
  child_name: string
  tariff_id: number
  tariff_snapshot: string        // JSON.stringify(TariffSnapshot)
  checked_in_at: string          // UTC ISO-8601
  checked_out_at: string | null
  duration_minutes: number | null
  total_cents: number | null
  status: SessionStatus
  sync_status: SyncStatus
  created_at: string
  updated_at: string
}

export interface CheckInDto {
  id: string           // caller provides the UUID
  child_name: string
  tariff_id: number
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
