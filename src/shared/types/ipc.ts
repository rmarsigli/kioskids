// IPC channel name constants.
// Convention: domain:action — enforced across all ipcMain.handle / ipcRenderer.invoke calls.
// This file lives in src/shared so both Main and Renderer import the exact same string values.

export const IPC_CHANNELS = {
  DB_GET_TARIFFS: 'db:get-tariffs',
  DB_CHECK_IN: 'db:check-in',
  DB_CHECK_OUT: 'db:check-out',
  DB_GET_SESSIONS: 'db:get-sessions',
  HW_PRINT_RECEIPT: 'hw:print-receipt',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

// Standard envelope returned by every ipcMain.handle.
// Errors are serialized here — raw Node errors must never cross the bridge.
export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }
