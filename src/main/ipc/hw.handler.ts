import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'

// Hardware integration is implemented in a dedicated task (TASK-HW).
// Stub registered here so renderer calls never throw "no handler" errors.
export function registerHwHandlers(): void {
  ipcMain.handle(IPC.HW.PRINT_RECEIPT, (): IpcResult<void> => {
    return { success: false, error: 'Hardware integration not yet implemented', code: 'NOT_IMPLEMENTED' }
  })
}
