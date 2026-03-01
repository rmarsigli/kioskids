import { BaseRepository } from './base.repository'
import type { Session, CheckInDto, CheckOutDto, TariffSnapshot } from '@shared/types/db'

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

  checkIn(dto: CheckInDto, snapshot: TariffSnapshot): Session {
    const now = new Date().toISOString()

    this.db
      .prepare(`
        INSERT INTO sessions
          (id, child_name, tariff_id, tariff_snapshot, checked_in_at,
           status, sync_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'open', 'pending', ?, ?)
      `)
      .run(dto.id, dto.child_name, dto.tariff_id, JSON.stringify(snapshot), now, now, now)

    return this.findById(dto.id)!
  }

  checkOut(dto: CheckOutDto): Session | undefined {
    const now = new Date().toISOString()

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

  markSynced(id: string): void {
    const now = new Date().toISOString()
    this.db
      .prepare("UPDATE sessions SET sync_status = 'synced', updated_at = ? WHERE id = ?")
      .run(now, id)
  }

  markSyncError(id: string): void {
    const now = new Date().toISOString()
    this.db
      .prepare("UPDATE sessions SET sync_status = 'error', updated_at = ? WHERE id = ?")
      .run(now, id)
  }
}
