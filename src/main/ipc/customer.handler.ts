import { ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type { Customer, CustomerWithGuardians, Guardian, GuardianPhone } from '@shared/types/db'
import {
  SaveCustomerSchema,
  SaveGuardianSchema,
  SaveGuardianPhoneSchema,
  SearchCustomersSchema,
} from '@shared/utils/customer-schema'
import {
  CustomerRepository,
  GuardianRepository,
  GuardianPhoneRepository,
} from '../database'

const customerRepo = new CustomerRepository()
const guardianRepo = new GuardianRepository()
const guardianPhoneRepo = new GuardianPhoneRepository()

/** Shared UUID schema for single-id payloads. */
const UuidSchema = z.object({ id: z.string().uuid() })

export function registerCustomerHandlers(): void {
  // Search customers by name (used by autocomplete in CheckIn and Customers list).
  ipcMain.handle(IPC.DB.SEARCH_CUSTOMERS, (_, dto: unknown): IpcResult<Customer[]> => {
    const parsed = SearchCustomersSchema.safeParse(dto)
    if (!parsed.success) {
      return { success: false, error: 'Query invalida.', code: 'VALIDATION_ERROR' }
    }
    try {
      const results = parsed.data.query.trim()
        ? customerRepo.findByName(parsed.data.query)
        : customerRepo.findAll()
      return { success: true, data: results }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Get a single customer with all guardians and their phones.
  ipcMain.handle(IPC.DB.GET_CUSTOMER, (_, dto: unknown): IpcResult<CustomerWithGuardians> => {
    const parsed = UuidSchema.safeParse(dto)
    if (!parsed.success) {
      return { success: false, error: 'ID invalido.', code: 'VALIDATION_ERROR' }
    }
    try {
      const customer = customerRepo.findWithGuardians(parsed.data.id)
      if (!customer) {
        return { success: false, error: 'Cliente nao encontrado.', code: 'NOT_FOUND' }
      }
      return { success: true, data: customer }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Create or update a customer record.
  ipcMain.handle(IPC.DB.SAVE_CUSTOMER, (_, dto: unknown): IpcResult<Customer> => {
    const parsed = SaveCustomerSchema.safeParse(dto)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join('; '),
        code: 'VALIDATION_ERROR',
      }
    }
    try {
      const id = parsed.data.id ?? randomUUID()
      const saved = customerRepo.save({ ...parsed.data, id })
      return { success: true, data: saved }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Create or update a guardian.
  ipcMain.handle(IPC.DB.SAVE_GUARDIAN, (_, dto: unknown): IpcResult<Guardian> => {
    const parsed = SaveGuardianSchema.safeParse(dto)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join('; '),
        code: 'VALIDATION_ERROR',
      }
    }
    try {
      const { id, ...rest } = parsed.data
      let saved: Guardian
      if (id) {
        const updated = guardianRepo.update(id, rest)
        if (!updated) {
          return { success: false, error: 'Responsavel nao encontrado.', code: 'NOT_FOUND' }
        }
        saved = updated
      } else {
        saved = guardianRepo.create({ id: randomUUID(), ...rest })
      }
      return { success: true, data: saved }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Delete a guardian (cascade removes its phones via FK).
  ipcMain.handle(IPC.DB.DELETE_GUARDIAN, (_, dto: unknown): IpcResult<void> => {
    const parsed = UuidSchema.safeParse(dto)
    if (!parsed.success) {
      return { success: false, error: 'ID invalido.', code: 'VALIDATION_ERROR' }
    }
    try {
      const deleted = guardianRepo.delete(parsed.data.id)
      if (!deleted) {
        return { success: false, error: 'Responsavel nao encontrado.', code: 'NOT_FOUND' }
      }
      return { success: true, data: undefined }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Add a phone number to a guardian.
  ipcMain.handle(IPC.DB.SAVE_GUARDIAN_PHONE, (_, dto: unknown): IpcResult<GuardianPhone> => {
    const parsed = SaveGuardianPhoneSchema.safeParse(dto)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join('; '),
        code: 'VALIDATION_ERROR',
      }
    }
    try {
      const { id, ...rest } = parsed.data
      // Phone records are immutable after creation — delete + re-create on update.
      const saved = guardianPhoneRepo.create({ id: id ?? randomUUID(), ...rest })
      return { success: true, data: saved }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Delete a phone entry.
  ipcMain.handle(IPC.DB.DELETE_GUARDIAN_PHONE, (_, dto: unknown): IpcResult<void> => {
    const parsed = UuidSchema.safeParse(dto)
    if (!parsed.success) {
      return { success: false, error: 'ID invalido.', code: 'VALIDATION_ERROR' }
    }
    try {
      const deleted = guardianPhoneRepo.delete(parsed.data.id)
      if (!deleted) {
        return { success: false, error: 'Telefone nao encontrado.', code: 'NOT_FOUND' }
      }
      return { success: true, data: undefined }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })
}
