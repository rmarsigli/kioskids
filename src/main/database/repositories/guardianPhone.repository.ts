import { BaseRepository } from './base.repository'
import type { GuardianPhone, SaveGuardianPhoneDto } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export class GuardianPhoneRepository extends BaseRepository {
  findById(id: string): GuardianPhone | undefined {
    return this.db
      .prepare('SELECT * FROM guardian_phones WHERE id = ?')
      .get(id) as GuardianPhone | undefined
  }

  findByGuardian(guardianId: string): GuardianPhone[] {
    return this.db
      .prepare('SELECT * FROM guardian_phones WHERE guardian_id = ? ORDER BY created_at')
      .all(guardianId) as GuardianPhone[]
  }

  create(dto: Omit<SaveGuardianPhoneDto, 'id'> & { id: string }): GuardianPhone {
    const now = nowIso()
    this.db
      .prepare(`
        INSERT INTO guardian_phones (id, guardian_id, phone, label, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(dto.id, dto.guardian_id, dto.phone, dto.label ?? null, now)
    return this.findById(dto.id)!
  }

  delete(id: string): boolean {
    const result = this.db
      .prepare('DELETE FROM guardian_phones WHERE id = ?')
      .run(id)
    return result.changes > 0
  }
}
