import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type Database from 'better-sqlite3'
import { nowIso } from '@shared/utils/time'

// Default path resolved relative to the compiled output directory.
// Tests override this by passing `migrationsDir` explicitly.
const DEFAULT_MIGRATIONS_DIR = join(__dirname, 'migrations', 'sql')

interface MigrationRow {
  filename: string
}

function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT    NOT NULL UNIQUE,
      applied_at TEXT    NOT NULL
    )
  `)
}

function getAppliedMigrations(db: Database.Database): Set<string> {
  const rows = db
    .prepare('SELECT filename FROM _migrations ORDER BY id')
    .all() as MigrationRow[]
  return new Set(rows.map((r) => r.filename))
}

/**
 * Runs all pending numbered `.sql` migrations from `migrationsDir`.
 * - Lexicographic sort guarantees order: 001, 002, 003 …
 * - Each migration is wrapped in its own transaction.
 * - Halts with a thrown error on any failure (prevents partial schema).
 * - Idempotent: already-applied migrations are skipped.
 */
export function runMigrations(db: Database.Database, migrationsDir?: string): void {
  const dir = migrationsDir ?? DEFAULT_MIGRATIONS_DIR

  ensureMigrationsTable(db)

  const applied = getAppliedMigrations(db)

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const insertRecord = db.prepare(
    'INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)',
  )

  for (const file of files) {
    if (applied.has(file)) continue

    const sql = readFileSync(join(dir, file), 'utf-8')

    db.transaction(() => {
      db.exec(sql)
      insertRecord.run(file, nowIso())
    })()
  }
}
