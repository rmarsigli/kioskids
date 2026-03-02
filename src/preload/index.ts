import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type {
  Tariff,
  Session,
  AppConfig,
  SaveTariffDto,
  CheckOutRequestDto,
  CheckInRequestDto,
  PreviewCheckoutResult,
  CancelSessionDto,
  Customer,
  CustomerWithGuardians,
  Guardian,
  GuardianPhone,
  SaveCustomerDto,
  SaveGuardianDto,
  SaveGuardianPhoneDto,
  SearchCustomersDto,
} from '@shared/types/db'

// Domain-scoped API wrappers. Each method is a thin invoke() call — no logic
// should live here. The renderer calls these and interprets the IpcResult<T>.
const dbApi = {
  checkIn: (dto: CheckInRequestDto): Promise<IpcResult<Session>> =>
    ipcRenderer.invoke(IPC.DB.CHECK_IN, dto),
  getTariffs: (): Promise<IpcResult<Tariff[]>> =>
    ipcRenderer.invoke(IPC.DB.GET_TARIFFS),
  getAllTariffs: (): Promise<IpcResult<Tariff[]>> =>
    ipcRenderer.invoke(IPC.DB.GET_ALL_TARIFFS),
  saveTariff: (dto: SaveTariffDto): Promise<IpcResult<Tariff>> =>
    ipcRenderer.invoke(IPC.DB.SAVE_TARIFF, dto),
  deactivateTariff: (id: number): Promise<IpcResult<void>> =>
    ipcRenderer.invoke(IPC.DB.DEACTIVATE_TARIFF, id),
  getActiveSessions: (): Promise<IpcResult<Session[]>> =>
    ipcRenderer.invoke(IPC.DB.GET_ACTIVE_SESSIONS),
  checkOutSession: (dto: CheckOutRequestDto): Promise<IpcResult<Session>> =>
    ipcRenderer.invoke(IPC.DB.CHECK_OUT, dto),
  previewCheckout: (id: string): Promise<IpcResult<PreviewCheckoutResult>> =>
    ipcRenderer.invoke(IPC.DB.PREVIEW_CHECKOUT, { id }),
  cancelSession: (dto: CancelSessionDto): Promise<IpcResult<Session>> =>
    ipcRenderer.invoke(IPC.DB.CANCEL_SESSION, dto),
  // Customer domain
  searchCustomers: (dto: SearchCustomersDto): Promise<IpcResult<Customer[]>> =>
    ipcRenderer.invoke(IPC.DB.SEARCH_CUSTOMERS, dto),
  getCustomer: (id: string): Promise<IpcResult<CustomerWithGuardians>> =>
    ipcRenderer.invoke(IPC.DB.GET_CUSTOMER, { id }),
  saveCustomer: (dto: SaveCustomerDto): Promise<IpcResult<Customer>> =>
    ipcRenderer.invoke(IPC.DB.SAVE_CUSTOMER, dto),
  saveGuardian: (dto: SaveGuardianDto): Promise<IpcResult<Guardian>> =>
    ipcRenderer.invoke(IPC.DB.SAVE_GUARDIAN, dto),
  deleteGuardian: (id: string): Promise<IpcResult<void>> =>
    ipcRenderer.invoke(IPC.DB.DELETE_GUARDIAN, { id }),
  saveGuardianPhone: (dto: SaveGuardianPhoneDto): Promise<IpcResult<GuardianPhone>> =>
    ipcRenderer.invoke(IPC.DB.SAVE_GUARDIAN_PHONE, dto),
  deleteGuardianPhone: (id: string): Promise<IpcResult<void>> =>
    ipcRenderer.invoke(IPC.DB.DELETE_GUARDIAN_PHONE, { id }),
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
