import type Database from 'better-sqlite3'
import { nowIso } from '@shared/utils/time'

const DEFAULT_TARIFF = {
  name: 'Padrão',
  price_per_minute: 50,      // R$0,50/min in cents
  grace_period_minutes: 0,
  rounding_minutes: 1,
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
      (name, price_per_minute, grace_period_minutes, rounding_minutes, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    DEFAULT_TARIFF.name,
    DEFAULT_TARIFF.price_per_minute,
    DEFAULT_TARIFF.grace_period_minutes,
    DEFAULT_TARIFF.rounding_minutes,
    DEFAULT_TARIFF.is_active,
    now,
    now,
  )
}
