import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type { Tariff } from '@shared/types/db'
import { TariffRepository } from '../database'

const tariffRepo = new TariffRepository()

export function registerDbHandlers(): void {
  ipcMain.handle(IPC.DB.GET_TARIFFS, (): IpcResult<Tariff[]> => {
    try {
      return { success: true, data: tariffRepo.findActive() }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })
}
