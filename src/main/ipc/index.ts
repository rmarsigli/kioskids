import { registerDbHandlers } from './db.handler'
import { registerHwHandlers } from './hw.handler'
import { registerAppHandlers } from './app.handler'
import { registerCustomerHandlers } from './customer.handler'

/**
 * Registers all ipcMain.handle listeners for each domain.
 * Must be called from the Main process AFTER initDatabase() so repositories
 * can safely access the DB singleton on first invocation.
 */
export function registerIpcHandlers(): void {
  registerDbHandlers()
  registerHwHandlers()
  registerAppHandlers()
  registerCustomerHandlers()
}
