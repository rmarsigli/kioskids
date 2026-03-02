import { BaseRepository } from './base.repository'
import type { AppConfig } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export class AppConfigRepository extends BaseRepository {
  get(key: string): string | undefined {
    const row = this.db
      .prepare('SELECT value FROM app_config WHERE key = ?')
      .get(key) as Pick<AppConfig, 'value'> | undefined

    return row?.value
  }

  set(key: string, value: string): void {
    const now = nowIso()
    this.db
      .prepare(`
        INSERT INTO app_config (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `)
      .run(key, value, now)
  }

  getAll(): AppConfig[] {
    return this.db
      .prepare('SELECT * FROM app_config ORDER BY key')
      .all() as AppConfig[]
  }
}
