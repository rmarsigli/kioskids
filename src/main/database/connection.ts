import Database from 'better-sqlite3'

// ---------------------------------------------------------------------------
// Singleton connection — no electron imports here so the module is testable
// in Vitest (Node) without mocking. Path resolution lives in database/index.ts.
// ---------------------------------------------------------------------------

let _db: Database.Database | null = null

/**
 * Returns the singleton Database instance.
 * Throws if `openDatabase()` has not been called yet.
 */
export function getDb(): Database.Database {
  if (!_db) {
    throw new Error('Database not initialised. Call initDatabase() before accessing the DB.')
  }
  return _db
}

/**
 * Opens (or creates) the SQLite database at `dbPath`.
 * Enables WAL mode and foreign key enforcement.
 * Idempotent — returns the existing instance if already open.
 */
export function openDatabase(dbPath: string): Database.Database {
  if (_db) return _db

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  return _db
}

/**
 * Closes the connection and resets the singleton.
 * Must be called in tests (afterEach) and on app quit.
 */
export function closeDatabase(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}
