// Canonical IPC channel name constants.
// Convention: domain:action — enforced across all ipcMain.handle / ipcRenderer.invoke calls.
// Lives in src/shared so both Main and Renderer import the exact same string values.
// Use IPC.DB.*, IPC.HW.*, IPC.APP.* — never raw strings.

export const IPC = {
  DB: {
    GET_TARIFFS: 'db:get-tariffs',
    GET_ALL_TARIFFS: 'db:get-all-tariffs',
    SAVE_TARIFF: 'db:save-tariff',
    DEACTIVATE_TARIFF: 'db:deactivate-tariff',
    CHECK_IN: 'db:check-in',
    CHECK_OUT: 'db:check-out',
    GET_SESSIONS: 'db:get-sessions',
  },
  HW: {
    PRINT_RECEIPT: 'hw:print-receipt',
  },
  APP: {
    GET_VERSION: 'app:get-version',
    GET_CONFIG: 'app:get-config',
  },
} as const

export type IpcChannel =
  | (typeof IPC.DB)[keyof typeof IPC.DB]
  | (typeof IPC.HW)[keyof typeof IPC.HW]
  | (typeof IPC.APP)[keyof typeof IPC.APP]
