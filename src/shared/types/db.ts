// Shared entity types and DTOs for the local SQLite database.
// Used by Main (repositories) and exposed to Renderer through IPC result types.
// No `any` allowed — all JSON fields are typed through dedicated interfaces.

import { TariffSnapshotSchema, type TariffSnapshot } from '@shared/utils/tariff-engine'

export type SessionStatus = 'open' | 'closed'
export type SyncStatus = 'pending' | 'synced' | 'error'

// Re-export so consumers that import from db.ts don't need a second import path.
export type { TariffSnapshot } from '@shared/utils/tariff-engine'

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
export function parseTariffSnapshot(raw: string): TariffSnapshot {
  return TariffSnapshotSchema.parse(JSON.parse(raw)) as TariffSnapshot
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
