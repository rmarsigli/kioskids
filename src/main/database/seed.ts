import type Database from 'better-sqlite3'
import { nowIso } from '@shared/utils/time'

// Default tariff: R$30,00 for 30 min + R$1,00 per additional minute, 5 min tolerance.
// Mirrors the primary worked example in .project/docs/tariff-engine.md.
const DEFAULT_TARIFF = {
  name: 'Padrão',
  base_price: 3000,
  base_minutes: 30,
  additional_fraction_price: 100,
  additional_fraction_minutes: 1,
  tolerance_minutes: 5,
  is_active: 1,
} as const

interface CountRow {
  n: number
}

/**
 * Inserts the default tariff if no tariffs exist (first run).
 * Idempotent — no-op when at least one tariff is already present.
 */
export function seedDefaultTariff(db: Database.Database): void {
  const { n } = db.prepare('SELECT COUNT(*) as n FROM tariffs').get() as CountRow
  if (n > 0) return

  const now = nowIso()

  db.prepare(`
    INSERT INTO tariffs
      (name, base_price, base_minutes, additional_fraction_price, additional_fraction_minutes, tolerance_minutes, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    DEFAULT_TARIFF.name,
    DEFAULT_TARIFF.base_price,
    DEFAULT_TARIFF.base_minutes,
    DEFAULT_TARIFF.additional_fraction_price,
    DEFAULT_TARIFF.additional_fraction_minutes,
    DEFAULT_TARIFF.tolerance_minutes,
    DEFAULT_TARIFF.is_active,
    now,
    now,
  )
}
