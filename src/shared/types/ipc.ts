// Re-export shim — canonical definitions have moved to dedicated files.
// Prefer importing directly from the canonical paths in new code:
//   import { IPC }        from '@shared/constants/ipc-channels'
//   import { IpcResult }  from '@shared/types/result'
export { IPC, IpcChannel } from '@shared/constants/ipc-channels'
export { IpcResult } from '@shared/types/result'

// Backward-compat flat alias — kept so existing tests compile without changes.
// Do not add new consumers; use IPC.DB.*, IPC.HW.*, IPC.APP.* instead.
import { IPC } from '@shared/constants/ipc-channels'
export const IPC_CHANNELS = {
  DB_GET_TARIFFS: IPC.DB.GET_TARIFFS,
  DB_CHECK_IN: IPC.DB.CHECK_IN,
  DB_CHECK_OUT: IPC.DB.CHECK_OUT,
  DB_GET_SESSIONS: IPC.DB.GET_SESSIONS,
  HW_PRINT_RECEIPT: IPC.HW.PRINT_RECEIPT,
} as const
