import { describe, expect, it } from 'vitest'
import { rsToCents, centsToRs, formatRs } from '../utils/currency'

describe('rsToCents', () => {
  it('converts "1,50" to 150', () => {
    expect(rsToCents('1,50')).toBe(150)
  })

  it('converts "0,01" to 1', () => {
    expect(rsToCents('0,01')).toBe(1)
  })

  it('strips "R$" prefix', () => {
    expect(rsToCents('R$ 10,00')).toBe(1000)
  })

  it('strips "R$" prefix without space', () => {
    expect(rsToCents('R$5,99')).toBe(599)
  })

  it('handles thousand-separator dots (>= 1.000,00)', () => {
    expect(rsToCents('1.000,00')).toBe(100000)
  })

  it('handles multiple thousand-separator dots', () => {
    expect(rsToCents('1.234.567,89')).toBe(123456789)
  })

  it('returns 0 for empty string', () => {
    expect(rsToCents('')).toBe(0)
  })

  it('returns 0 for non-numeric input', () => {
    expect(rsToCents('abc')).toBe(0)
  })

  it('returns 0 for negative values', () => {
    expect(rsToCents('-1,00')).toBe(0)
  })

  it('rounds half-up correctly', () => {
    // 0.005 * 100 floating-point issues — Math.round must handle this
    expect(rsToCents('0,005')).toBe(1)
  })

  it('converts "0,00" to 0', () => {
    expect(rsToCents('0,00')).toBe(0)
  })
})

describe('centsToRs', () => {
  it('formats 150 as "1,50"', () => {
    expect(centsToRs(150)).toBe('1,50')
  })

  it('formats 0 as "0,00"', () => {
    expect(centsToRs(0)).toBe('0,00')
  })

  it('formats 1 as "0,01"', () => {
    expect(centsToRs(1)).toBe('0,01')
  })

  it('formats 100000 as "1000,00"', () => {
    expect(centsToRs(100000)).toBe('1000,00')
  })

  it('formats 99 as "0,99"', () => {
    expect(centsToRs(99)).toBe('0,99')
  })
})

describe('formatRs', () => {
  it('prepends "R$ " to centsToRs result', () => {
    expect(formatRs(150)).toBe('R$ 1,50')
  })

  it('formats 0 correctly', () => {
    expect(formatRs(0)).toBe('R$ 0,00')
  })

  it('formatRs(x) === `R$ ${centsToRs(x)}` for arbitrary values', () => {
    const samples = [1, 99, 500, 1000, 9999, 100000]
    for (const v of samples) {
      expect(formatRs(v)).toBe(`R$ ${centsToRs(v)}`)
    }
  })
})

describe('rsToCents ↔ centsToRs round-trip', () => {
  it('is lossless for values expressible in cents', () => {
    const samples = [0, 1, 50, 99, 100, 150, 999, 1000, 9999, 100000]
    for (const cents of samples) {
      expect(rsToCents(centsToRs(cents))).toBe(cents)
    }
  })
})
