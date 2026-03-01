import type Database from 'better-sqlite3'
import { getDb } from '../connection'

/**
 * All repositories extend this class to access the singleton DB connection.
 * The getter delegates to `getDb()` so repositories never hold a direct
 * reference — safe for test teardown (closeDatabase resets the singleton).
 */
export abstract class BaseRepository {
  protected get db(): Database.Database {
    return getDb()
  }
}
