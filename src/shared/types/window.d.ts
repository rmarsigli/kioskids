import { ElectronAPI } from '@electron-toolkit/preload'
import type { IpcResult } from './result'
import type { Tariff, AppConfig, SaveTariffDto } from './db'

// Augments the global Window interface with the contextBridge API surface.
// window.electron — standard IPC utilities from @electron-toolkit/preload
// window.api     — domain-specific API surface exposed by src/preload/index.ts
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      db: {
        getTariffs: () => Promise<IpcResult<Tariff[]>>
        getAllTariffs: () => Promise<IpcResult<Tariff[]>>
        saveTariff: (dto: SaveTariffDto) => Promise<IpcResult<Tariff>>
        deactivateTariff: (id: number) => Promise<IpcResult<void>>
      }
      hw: {
        printReceipt: () => Promise<IpcResult<void>>
      }
      app: {
        getVersion: () => Promise<IpcResult<string>>
        getConfig: () => Promise<IpcResult<AppConfig[]>>
      }
    }
  }
}
