// Standard IPC result envelope.
// Every ipcMain.handle MUST return IpcResult<T> — raw Node errors must never
// cross the bridge (they lose prototype and can leak system paths).

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }
