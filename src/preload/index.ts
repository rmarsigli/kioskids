import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Full typed IPC surface is wired in TASK-003.
// window.electron exposes ipcRenderer.invoke/on/off — used only through
// domain-specific wrappers defined in TASK-003. Direct ipcRenderer calls
// in the renderer are forbidden.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {})
  } catch (error) {
    console.error(error)
  }
} else {
  // Fallback for environments where contextIsolation is disabled (never in prod)
  // @ts-expect-error intentional global assignment outside contextIsolation
  window.electron = electronAPI
  // @ts-expect-error intentional global assignment outside contextIsolation
  window.api = {}
}
