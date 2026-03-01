import { BaseRepository } from './base.repository'
import type { Tariff, SaveTariffDto } from '@shared/types/db'
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

  /**
   * Upsert: delegates to `create` when `data.id` is absent, `update` otherwise.
   * The caller is responsible for Zod-validating `data` before calling this.
   */
  save(data: SaveTariffDto): Tariff {
    if (data.id !== undefined) {
      const updated = this.update(data.id, data)
      if (!updated) throw new Error(`Tariff ${data.id} not found`)
      return updated
    }
    return this.create(data)
  }

  /**
   * Soft-delete: sets is_active = 0. Returns true when a row was changed.
   * Business rule "cannot deactivate last active tariff" is enforced in the
   * IPC handler — not here — so the repository stays free of policy logic.
   */
  deactivate(id: number): boolean {
    const result = this.db
      .prepare('UPDATE tariffs SET is_active = 0, updated_at = ? WHERE id = ?')
      .run(nowIso(), id)
    return result.changes > 0
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
