import { ElectronAPI } from '@electron-toolkit/preload'
import type { IpcResult } from './result'
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
} from './db'

// Augments the global Window interface with the contextBridge API surface.
// window.electron — standard IPC utilities from @electron-toolkit/preload
// window.api     — domain-specific API surface exposed by src/preload/index.ts
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      db: {
        checkIn: (dto: CheckInRequestDto) => Promise<IpcResult<Session>>
        getTariffs: () => Promise<IpcResult<Tariff[]>>
        getAllTariffs: () => Promise<IpcResult<Tariff[]>>
        saveTariff: (dto: SaveTariffDto) => Promise<IpcResult<Tariff>>
        deactivateTariff: (id: number) => Promise<IpcResult<void>>
        getActiveSessions: () => Promise<IpcResult<Session[]>>
        getTodaySessions: () => Promise<IpcResult<Session[]>>
        checkOutSession: (dto: CheckOutRequestDto) => Promise<IpcResult<Session>>
        previewCheckout: (id: string) => Promise<IpcResult<PreviewCheckoutResult>>
        cancelSession: (dto: CancelSessionDto) => Promise<IpcResult<Session>>
        // Customer domain
        searchCustomers: (dto: SearchCustomersDto) => Promise<IpcResult<Customer[]>>
        getCustomer: (id: string) => Promise<IpcResult<CustomerWithGuardians>>
        saveCustomer: (dto: SaveCustomerDto) => Promise<IpcResult<Customer>>
        saveGuardian: (dto: SaveGuardianDto) => Promise<IpcResult<Guardian>>
        deleteGuardian: (id: string) => Promise<IpcResult<void>>
        saveGuardianPhone: (dto: SaveGuardianPhoneDto) => Promise<IpcResult<GuardianPhone>>
        deleteGuardianPhone: (id: string) => Promise<IpcResult<void>>
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
