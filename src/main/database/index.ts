import { app } from 'electron'
import { join } from 'path'
import { openDatabase, closeDatabase, getDb } from './connection'
import { runMigrations } from './migrationRunner'
import { seedDefaultTariff } from './seed'

// Re-export primitives needed by IPC handlers
export { getDb, closeDatabase }

// Re-export repositories so IPC handlers import from a single location
export { TariffRepository } from './repositories/tariff.repository'
export { SessionRepository } from './repositories/session.repository'
export { SyncQueueRepository } from './repositories/syncQueue.repository'
export { AppConfigRepository } from './repositories/appConfig.repository'
export { CustomerRepository } from './repositories/customer.repository'
export { GuardianRepository } from './repositories/guardian.repository'
export { GuardianPhoneRepository } from './repositories/guardianPhone.repository'

/**
 * Initialises the database: opens the file, runs pending migrations, seeds
 * first-run data. Must be called from the Main process before any IPC handler
 * accesses the DB.
 *
 * `dbPath` is only used in tests — production always uses `app.getPath('userData')`.
 */
export function initDatabase(dbPath?: string): void {
  const resolvedPath = dbPath ?? join(app.getPath('userData'), 'kioskids.db')
  const db = openDatabase(resolvedPath)
  runMigrations(db)
  seedDefaultTariff(db)
}
