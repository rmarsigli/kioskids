import { BaseRepository } from './base.repository'
import type { SyncQueueEntry } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export class SyncQueueRepository extends BaseRepository {
  enqueue(sessionId: string, payload: string): SyncQueueEntry {
    const now = nowIso()
    const result = this.db
      .prepare(`
        INSERT INTO sync_queue (session_id, payload, attempts, created_at, updated_at)
        VALUES (?, ?, 0, ?, ?)
      `)
      .run(sessionId, payload, now, now)

    return this.findById(Number(result.lastInsertRowid))!
  }

  findById(id: number): SyncQueueEntry | undefined {
    return this.db
      .prepare('SELECT * FROM sync_queue WHERE id = ?')
      .get(id) as SyncQueueEntry | undefined
  }

  findPending(limit = 50): SyncQueueEntry[] {
    return this.db
      .prepare('SELECT * FROM sync_queue ORDER BY created_at LIMIT ?')
      .all(limit) as SyncQueueEntry[]
  }

  incrementAttempts(id: number, error: string | null): void {
    const now = nowIso()
    this.db
      .prepare(
        'UPDATE sync_queue SET attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?',
      )
      .run(error, now, id)
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM sync_queue WHERE id = ?').run(id)
  }
}
