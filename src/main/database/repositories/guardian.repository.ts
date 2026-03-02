import { BaseRepository } from './base.repository'
import type { Guardian, SaveGuardianDto } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export class GuardianRepository extends BaseRepository {
  findById(id: string): Guardian | undefined {
    return this.db
      .prepare('SELECT * FROM guardians WHERE id = ?')
      .get(id) as Guardian | undefined
  }

  findByCustomer(customerId: string): Guardian[] {
    return this.db
      .prepare('SELECT * FROM guardians WHERE customer_id = ? ORDER BY created_at')
      .all(customerId) as Guardian[]
  }

  create(dto: Omit<SaveGuardianDto, 'id'> & { id: string }): Guardian {
    const now = nowIso()
    this.db
      .prepare(`
        INSERT INTO guardians (id, customer_id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(dto.id, dto.customer_id, dto.name, now, now)
    return this.findById(dto.id)!
  }

  update(id: string, dto: Partial<Omit<SaveGuardianDto, 'id' | 'customer_id'>>): Guardian | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const now = nowIso()
    this.db
      .prepare('UPDATE guardians SET name = ?, updated_at = ? WHERE id = ?')
      .run(dto.name ?? existing.name, now, id)
    return this.findById(id)
  }

  delete(id: string): boolean {
    const result = this.db
      .prepare('DELETE FROM guardians WHERE id = ?')
      .run(id)
    return result.changes > 0
  }
}
