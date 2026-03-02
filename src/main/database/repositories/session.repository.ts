import { BaseRepository } from './base.repository'
import type { Session, CheckInDto, CheckOutDto, TariffSnapshot, SyncStatus } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export class SessionRepository extends BaseRepository {
  findById(id: string): Session | undefined {
    return this.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(id) as Session | undefined
  }

  findOpen(): Session[] {
    return this.db
      .prepare("SELECT * FROM sessions WHERE status = 'open' ORDER BY checked_in_at")
      .all() as Session[]
  }

  /** Returns sessions checked in today (local date), ordered newest first. */
  findClosedToday(): Session[] {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    return this.db
      .prepare(`
        SELECT * FROM sessions
         WHERE status = 'closed' AND date(checked_in_at) = ?
         ORDER BY checked_in_at DESC
      `)
      .all(today) as Session[]
  }

  findPendingSync(): Session[] {
    return this.db
      .prepare(`
        SELECT * FROM sessions
         WHERE sync_status = 'pending' AND status = 'closed'
         ORDER BY checked_out_at
      `)
      .all() as Session[]
  }

  /**
   * Inserts a new open session AND a corresponding sync_queue row in a single
   * SQLite transaction (offline-first contract — session is never created
   * without its pending sync record).
   */
  checkIn(dto: CheckInDto, snapshot: TariffSnapshot): Session {
    const now = nowIso()
    const snapshotJson = JSON.stringify(snapshot)
    const syncPayload = JSON.stringify({
      id: dto.id,
      child_name: dto.child_name,
      guardian_name: dto.guardian_name ?? null,
      guardian_contact: dto.guardian_contact ?? null,
      tariff_id: dto.tariff_id,
      tariff_snapshot: snapshotJson,
      checked_in_at: now,
    })

    this.db.transaction(() => {
      this.db
        .prepare(`
          INSERT INTO sessions
            (id, child_name, guardian_name, guardian_contact,
             tariff_id, tariff_snapshot, checked_in_at,
             status, sync_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'open', 'pending', ?, ?)
        `)
        .run(
          dto.id,
          dto.child_name,
          dto.guardian_name ?? null,
          dto.guardian_contact ?? null,
          dto.tariff_id,
          snapshotJson,
          now,
          now,
          now,
        )

      this.db
        .prepare(`
          INSERT INTO sync_queue (session_id, payload, attempts, created_at, updated_at)
          VALUES (?, ?, 0, ?, ?)
        `)
        .run(dto.id, syncPayload, now, now)
    })()

    return this.findById(dto.id)!
  }

  checkOut(dto: CheckOutDto): Session | undefined {
    const now = nowIso()

    this.db
      .prepare(`
        UPDATE sessions
           SET checked_out_at   = ?,
               duration_minutes = ?,
               total_cents      = ?,
               status           = 'closed',
               updated_at       = ?
         WHERE id = ? AND status = 'open'
      `)
      .run(dto.checked_out_at, dto.duration_minutes, dto.total_cents, now, dto.id)

    return this.findById(dto.id)
  }

  /**
   * Cancels an open session. Does NOT set duration_minutes or total_cents —
   * canceled sessions are not billed. Stores an optional reason in `notes`.
   * The WHERE clause guards against double-canceling a closed/already-canceled row.
   */
  cancel(id: string, notes?: string | null): Session | undefined {
    const now = nowIso()
    this.db
      .prepare(`
        UPDATE sessions
           SET status     = 'canceled',
               notes      = ?,
               updated_at = ?
         WHERE id = ? AND status = 'open'
      `)
      .run(notes ?? null, now, id)
    return this.findById(id)
  }

  markSynced(id: string): void {
    this.updateSyncStatus(id, 'synced')
  }

  markSyncError(id: string): void {
    this.updateSyncStatus(id, 'error')
  }

  private updateSyncStatus(id: string, status: SyncStatus): void {
    this.db
      .prepare('UPDATE sessions SET sync_status = ?, updated_at = ? WHERE id = ?')
      .run(status, nowIso(), id)
  }
}
