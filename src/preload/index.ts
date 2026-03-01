import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type { Tariff, AppConfig } from '@shared/types/db'

// Domain-scoped API wrappers. Each method is a thin invoke() call — no logic
// should live here. The renderer calls these and interprets the IpcResult<T>.
const dbApi = {
  getTariffs: (): Promise<IpcResult<Tariff[]>> =>
    ipcRenderer.invoke(IPC.DB.GET_TARIFFS),
}

const hwApi = {
  printReceipt: (): Promise<IpcResult<void>> =>
    ipcRenderer.invoke(IPC.HW.PRINT_RECEIPT),
}

const appApi = {
  getVersion: (): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC.APP.GET_VERSION),
  getConfig: (): Promise<IpcResult<AppConfig[]>> =>
    ipcRenderer.invoke(IPC.APP.GET_CONFIG),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      db: dbApi,
      hw: hwApi,
      app: appApi,
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // Fallback for environments where contextIsolation is disabled (never in prod)
  // @ts-expect-error intentional global assignment outside contextIsolation
  window.electron = electronAPI
  // @ts-expect-error intentional global assignment outside contextIsolation
  window.api = { db: dbApi, hw: hwApi, app: appApi }
}
