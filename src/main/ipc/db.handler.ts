import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type { Tariff, SaveTariffDto } from '@shared/types/db'
import { SaveTariffSchema } from '@shared/utils/tariff-schema'
import { TariffRepository } from '../database'

const tariffRepo = new TariffRepository()

export function registerDbHandlers(): void {
  // Returns active tariffs only — used by the check-in dropdown.
  ipcMain.handle(IPC.DB.GET_TARIFFS, (): IpcResult<Tariff[]> => {
    try {
      return { success: true, data: tariffRepo.findActive() }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Returns all tariffs (active + inactive) — used by the management page.
  ipcMain.handle(IPC.DB.GET_ALL_TARIFFS, (): IpcResult<Tariff[]> => {
    try {
      return { success: true, data: tariffRepo.findAll() }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Create or update a tariff. Zod-validates the DTO before touching the DB.
  ipcMain.handle(
    IPC.DB.SAVE_TARIFF,
    (_, dto: unknown): IpcResult<Tariff> => {
      const parsed = SaveTariffSchema.safeParse(dto)
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.errors.map((e) => e.message).join('; '),
          code: 'VALIDATION_ERROR',
        }
      }
      try {
        return { success: true, data: tariffRepo.save(parsed.data as SaveTariffDto) }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )

  // Soft-delete: sets is_active = 0. Rejects when it would leave zero active tariffs.
  ipcMain.handle(
    IPC.DB.DEACTIVATE_TARIFF,
    (_, id: unknown): IpcResult<void> => {
      if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
        return { success: false, error: 'ID invalido.', code: 'VALIDATION_ERROR' }
      }
      try {
        const active = tariffRepo.findActive()
        if (active.length <= 1 && active[0]?.id === id) {
          return {
            success: false,
            error: 'Nao e possivel desativar a unica tarifa ativa.',
            code: 'LAST_ACTIVE_TARIFF',
          }
        }
        const changed = tariffRepo.deactivate(id)
        if (!changed) return { success: false, error: 'Tarifa nao encontrada.', code: 'NOT_FOUND' }
        return { success: true, data: undefined }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )
}
