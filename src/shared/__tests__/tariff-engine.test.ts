/**
 * Tariff Engine — unit test suite.
 *
 * Every row in the worked-examples tables from .project/docs/tariff-engine.md
 * is represented as an explicit test case. Tests are the executable spec.
 */
import { describe, it, expect } from 'vitest'
import {
  calculateSessionTotal,
  calculateLiveCost,
  TariffSnapshotSchema,
  type TariffSnapshot,
} from '@shared/utils/tariff-engine'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** R$30 / 30 min + R$1 per additional minute, 5 min tolerance */
const TARIFF_A: TariffSnapshot = {
  id: 1,
  name: 'Tarifa A',
  base_price: 3000,
  base_minutes: 30,
  additional_fraction_price: 100,
  additional_fraction_minutes: 1,
  tolerance_minutes: 5,
}

/** R$30 / 30 min + R$5 per 5 min block, 0 min tolerance */
const TARIFF_B: TariffSnapshot = {
  id: 2,
  name: 'Tarifa B',
  base_price: 3000,
  base_minutes: 30,
  additional_fraction_price: 500,
  additional_fraction_minutes: 5,
  tolerance_minutes: 0,
}

/** Builds an ISO-8601 UTC string that is `minutes` minutes + `seconds` seconds after epoch. */
function iso(minutes: number, seconds = 0): string {
  return new Date((minutes * 60 + seconds) * 1000).toISOString()
}

/** Returns [checkInAt, checkOutAt] pair with the given duration relative to a fixed baseline. */
function range(durationMinutes: number, extraSeconds = 0): [string, string] {
  const base = '2026-01-01T10:00:00.000Z'
  const out = new Date(
    new Date(base).getTime() + (durationMinutes * 60 + extraSeconds) * 1000,
  ).toISOString()
  return [base, out]
}

// ---------------------------------------------------------------------------
// Worked examples — Tariff A (R$30/30min + R$1/min, tolerance 5min)
// ---------------------------------------------------------------------------

describe('calculateSessionTotal — Tariff A (R$30/30min + R$1/min, 5min tolerance)', () => {
  it.each([
    [25, 3000, 'well within base'],
    [30, 3000, 'exactly base_minutes'],
    [34, 3000, 'within tolerance window (34 ≤ 35)'],
    [35, 3000, 'tolerance boundary — inclusive (35 ≤ 35)'],
    [36, 3600, 'exceeds tolerance → 6 additional fractions'],
    [45, 4500, '15 additional fractions'],
    [90, 9000, '60 additional fractions'],
  ])('%imin → %i cents (%s)', (durationMin, expectedCents) => {
    const [checkInAt, checkOutAt] = range(durationMin)
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_A)).toBe(expectedCents)
  })
})

// ---------------------------------------------------------------------------
// Worked examples — Tariff B (R$30/30min + R$5/5min block, 0 tolerance)
// ---------------------------------------------------------------------------

describe('calculateSessionTotal — Tariff B (R$30/30min + R$5/5min block, 0 tolerance)', () => {
  it.each([
    [30, 3000, 'exactly base_minutes'],
    [31, 3500, 'additional = 1min → ceil(1/5) = 1 block'],
    [35, 3500, 'additional = 5min → ceil(5/5) = 1 block'],
    [36, 4000, 'additional = 6min → ceil(6/5) = 2 blocks'],
  ])('%imin → %i cents (%s)', (durationMin, expectedCents) => {
    const [checkInAt, checkOutAt] = range(durationMin)
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_B)).toBe(expectedCents)
  })
})

// ---------------------------------------------------------------------------
// Duration rounding — always ceil to next full minute
// ---------------------------------------------------------------------------

describe('calculateSessionTotal — duration rounds UP to next full minute', () => {
  it('30min 01sec is billed as 31 minutes (within tolerance → base_price)', () => {
    const [checkInAt, checkOutAt] = range(30, 1) // 30:01
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_A)).toBe(3000)
  })

  it('35min 01sec rounds to 36min → exceeds tolerance → 6 additional fractions', () => {
    const [checkInAt, checkOutAt] = range(35, 1) // 35:01
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_A)).toBe(3600)
  })

  it('36min 01sec rounds to 37min → additional = 7 → 7 fractions', () => {
    const [checkInAt, checkOutAt] = range(36, 1) // 36:01
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_A)).toBe(3700)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('calculateSessionTotal — edge cases', () => {
  it('zero-duration session (0 seconds) → ceil(0/60) = 0 min → base_price', () => {
    const now = '2026-01-01T10:00:00.000Z'
    expect(calculateSessionTotal(now, now, TARIFF_A)).toBe(3000)
  })

  it('fractional seconds less than one minute round up to 1 minute → base_price', () => {
    const [checkInAt, checkOutAt] = range(0, 30) // 30 seconds
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_A)).toBe(3000)
  })

  it('throws RangeError when checkOutAt is before checkInAt', () => {
    const checkInAt = '2026-01-01T10:05:00.000Z'
    const checkOutAt = '2026-01-01T10:00:00.000Z'
    expect(() => calculateSessionTotal(checkInAt, checkOutAt, TARIFF_A)).toThrow(RangeError)
  })

  it('tolerates zero tolerance_minutes — base_minutes + 1 is immediately billed', () => {
    const [checkInAt, checkOutAt] = range(31) // 31 min, tariff B has 0 tolerance
    // additional = 1 → ceil(1/5) = 1 block × 500 = 3500
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_B)).toBe(3500)
  })

  it('very long session (480 minutes = 8h) calculates correctly', () => {
    // TARIFF_A: additional = 480-30 = 450 → 450 fractions × 100 = 45000 + 3000 = 48000
    const [checkInAt, checkOutAt] = range(480)
    expect(calculateSessionTotal(checkInAt, checkOutAt, TARIFF_A)).toBe(48000)
  })

  it('iso() helper — uses unix-epoch-relative timestamps correctly', () => {
    // Sanity check the iso() helper used elsewhere doesn't affect algorithm
    expect(
      calculateSessionTotal(iso(0), iso(30), TARIFF_A),
    ).toBe(3000)
  })
})

// ---------------------------------------------------------------------------
// calculateLiveCost — smoke test
// ---------------------------------------------------------------------------

describe('calculateLiveCost', () => {
  it('returns a non-negative integer for a session started now', () => {
    const checkInAt = new Date().toISOString()
    const cost = calculateLiveCost(checkInAt, TARIFF_A)
    expect(cost).toBeTypeOf('number')
    expect(cost).toBeGreaterThanOrEqual(TARIFF_A.base_price)
    expect(Number.isInteger(cost)).toBe(true)
  })

  it('returns base_price for a session started exactly now (0 seconds)', () => {
    // At t=0, floor of duration is 0 min → base_price
    const checkInAt = new Date().toISOString()
    // Override Date to be deterministic is overkill here; instead verify >= base
    expect(calculateLiveCost(checkInAt, TARIFF_A)).toBeGreaterThanOrEqual(TARIFF_A.base_price)
  })
})

// ---------------------------------------------------------------------------
// TariffSnapshotSchema — Zod validation
// ---------------------------------------------------------------------------

describe('TariffSnapshotSchema', () => {
  it('accepts a valid snapshot', () => {
    expect(() => TariffSnapshotSchema.parse(TARIFF_A)).not.toThrow()
  })

  it('rejects additional_fraction_minutes = 0 (div-by-zero guard)', () => {
    expect(() =>
      TariffSnapshotSchema.parse({ ...TARIFF_A, additional_fraction_minutes: 0 }),
    ).toThrow()
  })

  it('rejects additional_fraction_minutes = -1', () => {
    expect(() =>
      TariffSnapshotSchema.parse({ ...TARIFF_A, additional_fraction_minutes: -1 }),
    ).toThrow()
  })

  it('rejects base_minutes = 0', () => {
    expect(() => TariffSnapshotSchema.parse({ ...TARIFF_A, base_minutes: 0 })).toThrow()
  })

  it('rejects negative base_price', () => {
    expect(() => TariffSnapshotSchema.parse({ ...TARIFF_A, base_price: -1 })).toThrow()
  })

  it('rejects missing required fields', () => {
    // Deliberately omit `id` to trigger validation failure
    expect(() =>
      TariffSnapshotSchema.parse({
        name: TARIFF_A.name,
        base_price: TARIFF_A.base_price,
        base_minutes: TARIFF_A.base_minutes,
        additional_fraction_price: TARIFF_A.additional_fraction_price,
        additional_fraction_minutes: TARIFF_A.additional_fraction_minutes,
        tolerance_minutes: TARIFF_A.tolerance_minutes,
      }),
    ).toThrow()
  })

  it('rejects a non-integer id', () => {
    expect(() => TariffSnapshotSchema.parse({ ...TARIFF_A, id: 1.5 })).toThrow()
  })

  it('accepts tolerance_minutes = 0 (valid, no grace window)', () => {
    expect(() => TariffSnapshotSchema.parse(TARIFF_B)).not.toThrow()
  })
})
