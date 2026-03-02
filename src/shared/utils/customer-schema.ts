import { z } from 'zod'

// ---------------------------------------------------------------------------
// Guardian phone
// ---------------------------------------------------------------------------

export const SaveGuardianPhoneSchema = z.object({
  /** Present on update; absent on create. */
  id: z.string().uuid().optional(),
  guardian_id: z.string().uuid(),
  phone: z.string().min(1, 'Telefone obrigatorio.').max(30),
  label: z.string().max(50).nullable().optional(),
})

export type SaveGuardianPhoneDto = z.infer<typeof SaveGuardianPhoneSchema>

// ---------------------------------------------------------------------------
// Guardian
// ---------------------------------------------------------------------------

export const SaveGuardianSchema = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid(),
  name: z.string().min(1, 'Nome do responsavel obrigatorio.').max(120),
})

export type SaveGuardianDto = z.infer<typeof SaveGuardianSchema>

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

/**
 * ISO-8601 date string (YYYY-MM-DD) or null.
 * We validate the shape without converting to a Date object so SQLite can
 * store it as TEXT without serialisation round-trips.
 */
const IsoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data invalido (YYYY-MM-DD).')
  .nullable()
  .optional()

export const SaveCustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nome obrigatorio.').max(200),
  date_of_birth: IsoDateStringSchema,
  notes: z.string().max(1000).nullable().optional(),
})

export type SaveCustomerDto = z.infer<typeof SaveCustomerSchema>

/** Used by the CheckIn autocomplete and the Customers list search input. */
export const SearchCustomersSchema = z.object({
  query: z.string().max(200).default(''),
})

export type SearchCustomersDto = z.infer<typeof SearchCustomersSchema>
