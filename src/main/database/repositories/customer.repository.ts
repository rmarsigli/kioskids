import { BaseRepository } from './base.repository'
import type { Customer, CustomerWithGuardians, Guardian, GuardianPhone, SaveCustomerDto } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export class CustomerRepository extends BaseRepository {
  findById(id: string): Customer | undefined {
    return this.db
      .prepare('SELECT * FROM customers WHERE id = ?')
      .get(id) as Customer | undefined
  }

  /**
   * Case-insensitive prefix/substring search (LIKE with leading wildcard on
   * short queries is fine at this scale — no FTS needed).
   */
  findByName(query: string, limit = 20): Customer[] {
    return this.db
      .prepare('SELECT * FROM customers WHERE name LIKE ? ORDER BY name LIMIT ?')
      .all(`%${query}%`, limit) as Customer[]
  }

  findAll(limit = 100): Customer[] {
    return this.db
      .prepare('SELECT * FROM customers ORDER BY name LIMIT ?')
      .all(limit) as Customer[]
  }

  /**
   * Returns a customer with all guardians and their phone numbers eagerly
   * loaded via two secondary queries (avoids N+1 and keeps SQLite-safe).
   */
  findWithGuardians(id: string): CustomerWithGuardians | undefined {
    const customer = this.findById(id)
    if (!customer) return undefined

    const guardians = this.db
      .prepare('SELECT * FROM guardians WHERE customer_id = ? ORDER BY created_at')
      .all(id) as Guardian[]

    const phones = this.db
      .prepare(
        `SELECT gp.* FROM guardian_phones gp
          JOIN guardians g ON g.id = gp.guardian_id
         WHERE g.customer_id = ?
         ORDER BY gp.created_at`,
      )
      .all(id) as GuardianPhone[]

    const phonesByGuardian = phones.reduce<Record<string, GuardianPhone[]>>(
      (acc, phone) => {
        if (!acc[phone.guardian_id]) acc[phone.guardian_id] = []
        acc[phone.guardian_id].push(phone)
        return acc
      },
      {},
    )

    return {
      ...customer,
      guardians: guardians.map((g) => ({
        ...g,
        phones: phonesByGuardian[g.id] ?? [],
      })),
    }
  }

  create(dto: Omit<SaveCustomerDto, 'id'> & { id: string }): Customer {
    const now = nowIso()
    this.db
      .prepare(`
        INSERT INTO customers (id, name, date_of_birth, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(dto.id, dto.name, dto.date_of_birth ?? null, dto.notes ?? null, now, now)
    return this.findById(dto.id)!
  }

  update(id: string, dto: Partial<Omit<SaveCustomerDto, 'id'>>): Customer | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const now = nowIso()
    this.db
      .prepare(`
        UPDATE customers
           SET name          = ?,
               date_of_birth = ?,
               notes         = ?,
               updated_at    = ?
         WHERE id = ?
      `)
      .run(
        dto.name ?? existing.name,
        dto.date_of_birth !== undefined ? (dto.date_of_birth ?? null) : existing.date_of_birth,
        dto.notes !== undefined ? (dto.notes ?? null) : existing.notes,
        now,
        id,
      )
    return this.findById(id)
  }

  /** Upsert: create if `dto.id` is absent, update otherwise. */
  save(dto: SaveCustomerDto & { id: string }): Customer {
    const existing = this.findById(dto.id)
    if (existing) {
      return this.update(dto.id, dto)!
    }
    return this.create(dto)
  }
}
