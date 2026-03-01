/**
 * Zod validation schema for tariff save operations (create + update).
 * Shared between Main (IPC handler validation) and Renderer (form validation)
 * so the same rules are enforced at every layer.
 *
 * All monetary values are integer cents; all time values are integer minutes.
 */
import { z } from 'zod'

export const SaveTariffSchema = z.object({
  /** Present for updates, absent for inserts. */
  id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Nome e obrigatorio'),
  /** Integer cents — price covering the first `base_minutes`. */
  base_price: z.number().int().nonnegative('Deve ser >= 0'),
  /** Minutes covered by the base price (>= 1). */
  base_minutes: z.number().int().min(1, 'Deve ser >= 1 minuto'),
  /** Integer cents — price per additional fraction. */
  additional_fraction_price: z.number().int().nonnegative('Deve ser >= 0'),
  /** Minutes per additional fraction (>= 1 — prevents division by zero). */
  additional_fraction_minutes: z.number().int().min(1, 'Deve ser >= 1 minuto'),
  /** Grace window in minutes before extra billing kicks in (can be 0). */
  tolerance_minutes: z.number().int().nonnegative('Deve ser >= 0'),
  is_active: z.union([z.literal(0), z.literal(1)]),
})

export type SaveTariffDto = z.infer<typeof SaveTariffSchema>
