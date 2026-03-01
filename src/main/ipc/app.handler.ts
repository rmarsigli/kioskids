import { app, ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type { AppConfig } from '@shared/types/db'
import { AppConfigRepository } from '../database'

const configRepo = new AppConfigRepository()

export function registerAppHandlers(): void {
  ipcMain.handle(IPC.APP.GET_VERSION, (): IpcResult<string> => {
    return { success: true, data: app.getVersion() }
  })

  ipcMain.handle(IPC.APP.GET_CONFIG, (): IpcResult<AppConfig[]> => {
    try {
      return { success: true, data: configRepo.getAll() }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })
}
