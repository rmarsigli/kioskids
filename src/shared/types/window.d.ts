import { ElectronAPI } from '@electron-toolkit/preload'

// Augments the global Window interface with the contextBridge API surface.
// window.electron — standard IPC utilities from @electron-toolkit/preload
// window.api     — domain-specific API surface, typed and expanded in TASK-003
declare global {
  interface Window {
    electron: ElectronAPI
    api: Record<string, never>
  }
}
