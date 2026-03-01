import { BaseRepository } from './base.repository'
import type { Tariff } from '@shared/types/db'

export class TariffRepository extends BaseRepository {
  findAll(): Tariff[] {
    return this.db
      .prepare('SELECT * FROM tariffs ORDER BY id')
      .all() as Tariff[]
  }

  findActive(): Tariff[] {
    return this.db
      .prepare('SELECT * FROM tariffs WHERE is_active = 1 ORDER BY id')
      .all() as Tariff[]
  }

  findById(id: number): Tariff | undefined {
    return this.db
      .prepare('SELECT * FROM tariffs WHERE id = ?')
      .get(id) as Tariff | undefined
  }

  create(data: Omit<Tariff, 'id' | 'created_at' | 'updated_at'>): Tariff {
    const now = new Date().toISOString()
    const result = this.db
      .prepare(`
        INSERT INTO tariffs
          (name, price_per_minute, grace_period_minutes, rounding_minutes, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        data.name,
        data.price_per_minute,
        data.grace_period_minutes,
        data.rounding_minutes,
        data.is_active,
        now,
        now,
      )

    return this.findById(result.lastInsertRowid as number)!
  }

  update(id: number, data: Partial<Omit<Tariff, 'id' | 'created_at'>>): Tariff | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const now = new Date().toISOString()
    const merged: Tariff = { ...existing, ...data, updated_at: now }

    this.db
      .prepare(`
        UPDATE tariffs
           SET name = ?, price_per_minute = ?, grace_period_minutes = ?,
               rounding_minutes = ?, is_active = ?, updated_at = ?
         WHERE id = ?
      `)
      .run(
        merged.name,
        merged.price_per_minute,
        merged.grace_period_minutes,
        merged.rounding_minutes,
        merged.is_active,
        merged.updated_at,
        id,
      )

    return this.findById(id)
  }
}
