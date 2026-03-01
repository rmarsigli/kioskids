/**
 * Currency helpers for KiosKids — all monetary values are stored as integer cents.
 * These utilities convert between the internal integer representation and
 * human-friendly Brazilian Real strings used in the UI.
 */

/**
 * Converts a Brazilian Real string ("1,50" or "R$ 1,50") to integer cents.
 * Returns 0 for invalid input so callers can handle NaN-free.
 *
 * @example rsToCents("1,50")     → 150
 * @example rsToCents("R$ 10,00") → 1000
 */
export function rsToCents(value: string): number {
  const cleaned = value.replace(/R\$\s*/g, '').trim()
  const normalized = cleaned.replace('.', '').replace(',', '.')
  const parsed = parseFloat(normalized)
  if (isNaN(parsed) || parsed < 0) return 0
  return Math.round(parsed * 100)
}

/**
 * Formats integer cents as a Brazilian Real string without the currency symbol.
 * Use `formatRs` when you need the full "R$ X,XX" label.
 *
 * @example centsToRs(150)  → "1,50"
 * @example centsToRs(1000) → "10,00"
 */
export function centsToRs(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

/**
 * Formats integer cents as a full Brazilian Real currency string.
 *
 * @example formatRs(150)  → "R$ 1,50"
 * @example formatRs(1000) → "R$ 10,00"
 */
export function formatRs(cents: number): string {
  return `R$ ${centsToRs(cents)}`
}
