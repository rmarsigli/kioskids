import { BaseRepository } from './base.repository'
import type { Tariff } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

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
    const now = nowIso()
    const result = this.db
      .prepare(`
        INSERT INTO tariffs
          (name, base_price, base_minutes, additional_fraction_price, additional_fraction_minutes, tolerance_minutes, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        data.name,
        data.base_price,
        data.base_minutes,
        data.additional_fraction_price,
        data.additional_fraction_minutes,
        data.tolerance_minutes,
        data.is_active,
        now,
        now,
      )

    return this.findById(Number(result.lastInsertRowid))!
  }

  update(id: number, data: Partial<Omit<Tariff, 'id' | 'created_at'>>): Tariff | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const now = nowIso()
    const merged: Tariff = { ...existing, ...data, updated_at: now }

    this.db
      .prepare(`
        UPDATE tariffs
           SET name = ?, base_price = ?, base_minutes = ?,
               additional_fraction_price = ?, additional_fraction_minutes = ?,
               tolerance_minutes = ?, is_active = ?, updated_at = ?
         WHERE id = ?
      `)
      .run(
        merged.name,
        merged.base_price,
        merged.base_minutes,
        merged.additional_fraction_price,
        merged.additional_fraction_minutes,
        merged.tolerance_minutes,
        merged.is_active,
        merged.updated_at,
        id,
      )

    return this.findById(id)
  }
}
