/**
 * Tariff Engine — canonical billing calculation for KiosKids sessions.
 *
 * Pure functions only. No side effects. No DB or IPC imports.
 * Both the Electron kiosk and the Laravel Core implement this algorithm identically.
 *
 * See: .project/docs/tariff-engine.md for the full specification and worked examples.
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema + type
// ---------------------------------------------------------------------------

/**
 * Zod schema for the immutable TariffSnapshot stored on a session at check-in.
 * Validated here so callers get typed errors early, not silent wrong math.
 */
export const TariffSnapshotSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  base_price: z.number().int().nonnegative(),
  base_minutes: z.number().int().min(1),
  additional_fraction_price: z.number().int().nonnegative(),
  /** Must be >= 1 to avoid division-by-zero in the fraction calculation. */
  additional_fraction_minutes: z.number().int().min(1),
  tolerance_minutes: z.number().int().nonnegative(),
})

export type TariffSnapshot = z.infer<typeof TariffSnapshotSchema>

// ---------------------------------------------------------------------------
// Core algorithm
// ---------------------------------------------------------------------------

/**
 * Calculates the total session cost in integer cents.
 *
 * Algorithm (from tariff-engine.md):
 *   durationMinutes = ceil(durationSeconds / 60)
 *   if durationMinutes <= base_minutes + tolerance_minutes → base_price
 *   else:
 *     additionalMinutes  = durationMinutes - base_minutes
 *     additionalFractions = ceil(additionalMinutes / additional_fraction_minutes)
 *     total = base_price + additionalFractions * additional_fraction_price
 *
 * Key rules:
 *   - Duration is always rounded **up** to the next full minute.
 *   - Tolerance is a threshold guard only — additional minutes are still counted
 *     from base_minutes, not from (base_minutes + tolerance_minutes).
 *   - All math is integer — no floating-point.
 *
 * @param checkInAt  - UTC ISO-8601 string
 * @param checkOutAt - UTC ISO-8601 string (must be >= checkInAt)
 * @param tariff     - Validated TariffSnapshot captured at check-in
 * @returns Total cost in cents (integer ≥ 0)
 * @throws {RangeError} if checkOutAt is before checkInAt
 */
export function calculateSessionTotal(
  checkInAt: string,
  checkOutAt: string,
  tariff: TariffSnapshot,
): number {
  const durationSeconds =
    (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 1000

  if (durationSeconds < 0) {
    throw new RangeError(
      `checkOutAt (${checkOutAt}) must not be before checkInAt (${checkInAt})`,
    )
  }

  const durationMinutes = Math.ceil(durationSeconds / 60)

  if (durationMinutes <= tariff.base_minutes + tariff.tolerance_minutes) {
    return tariff.base_price
  }

  const additionalMinutes = durationMinutes - tariff.base_minutes
  const additionalFractions = Math.ceil(additionalMinutes / tariff.additional_fraction_minutes)

  return tariff.base_price + additionalFractions * tariff.additional_fraction_price
}

/**
 * Calculates the running cost from check-in to right now.
 * Used by the live dashboard ticker. Always based on current wall-clock time.
 *
 * @param checkInAt - UTC ISO-8601 string
 * @param tariff    - Validated TariffSnapshot captured at check-in
 * @returns Current estimated cost in cents
 */
export function calculateLiveCost(checkInAt: string, tariff: TariffSnapshot): number {
  return calculateSessionTotal(checkInAt, new Date().toISOString(), tariff)
}
