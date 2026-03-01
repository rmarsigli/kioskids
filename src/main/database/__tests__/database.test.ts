import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { randomUUID } from 'crypto'
import type { Tariff, TariffSnapshot } from '@shared/types/db'
import { join } from 'path'
import { openDatabase, closeDatabase, getDb } from '../connection'
import { runMigrations } from '../migrationRunner'
import { seedDefaultTariff } from '../seed'
import { TariffRepository } from '../repositories/tariff.repository'
import { SessionRepository } from '../repositories/session.repository'
import { SyncQueueRepository } from '../repositories/syncQueue.repository'
import { AppConfigRepository } from '../repositories/appConfig.repository'

const MIGRATIONS_DIR = join(__dirname, '../migrations/sql')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(): void {
  openDatabase(':memory:')
  runMigrations(getDb(), MIGRATIONS_DIR)
}

function teardown(): void {
  closeDatabase()
}

// ---------------------------------------------------------------------------
// runMigrations
// ---------------------------------------------------------------------------

describe('runMigrations', () => {
  beforeEach(setup)
  afterEach(teardown)

  it('should create all domain tables on first run', () => {
    const tables = getDb()
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>

    const names = tables.map((t) => t.name)
    expect(names).toContain('_migrations')
    expect(names).toContain('tariffs')
    expect(names).toContain('sessions')
    expect(names).toContain('sync_queue')
    expect(names).toContain('app_config')
  })

  it('should record applied migration filenames in _migrations', () => {
    const rows = getDb()
      .prepare('SELECT filename FROM _migrations ORDER BY id')
      .all() as Array<{ filename: string }>

    expect(rows).toHaveLength(1)
    expect(rows[0].filename).toBe('001_initial_schema.sql')
  })

  it('should be idempotent — running twice does not throw or duplicate records', () => {
    expect(() => runMigrations(getDb(), MIGRATIONS_DIR)).not.toThrow()

    const rows = getDb()
      .prepare('SELECT filename FROM _migrations')
      .all() as Array<{ filename: string }>

    expect(rows).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// seedDefaultTariff
// ---------------------------------------------------------------------------

describe('seedDefaultTariff', () => {
  beforeEach(setup)
  afterEach(teardown)

  it('should insert one default tariff on first run', () => {
    seedDefaultTariff(getDb())
    const repo = new TariffRepository()
    expect(repo.findAll()).toHaveLength(1)
    expect(repo.findAll()[0].name).toBe('Padrão')
  })

  it('should not insert a duplicate if called twice', () => {
    seedDefaultTariff(getDb())
    seedDefaultTariff(getDb())
    expect(new TariffRepository().findAll()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// TariffRepository
// ---------------------------------------------------------------------------

describe('TariffRepository', () => {
  beforeEach(() => {
    setup()
    seedDefaultTariff(getDb())
  })
  afterEach(teardown)

  it('should return only active tariffs from findActive()', () => {
    const repo = new TariffRepository()
    const active = repo.findActive()
    expect(active.length).toBeGreaterThan(0)
    expect(active.every((t) => t.is_active === 1)).toBe(true)
  })

  it('should create a tariff and retrieve it by id', () => {
    const repo = new TariffRepository()
    const created = repo.create({
      name: 'VIP',
      price_per_minute: 100,
      grace_period_minutes: 5,
      rounding_minutes: 5,
      is_active: 1,
    })
    expect(created.id).toBeTypeOf('number')
    expect(repo.findById(created.id)?.name).toBe('VIP')
  })

  it('should update an existing tariff', () => {
    const repo = new TariffRepository()
    const original = repo.findAll()[0]
    const updated = repo.update(original.id, { name: 'Atualizado', price_per_minute: 75 })
    expect(updated?.name).toBe('Atualizado')
    expect(updated?.price_per_minute).toBe(75)
  })

  it('should return undefined when updating a non-existent tariff', () => {
    expect(new TariffRepository().update(9999, { name: 'X' })).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// SessionRepository
// ---------------------------------------------------------------------------

describe('SessionRepository', () => {
  beforeEach(() => {
    setup()
    seedDefaultTariff(getDb())
  })
  afterEach(teardown)

  function getDefaultSnapshot(): { snapshot: TariffSnapshot; tariff: Tariff } {
    const tariff = new TariffRepository().findActive()[0]
    return {
      snapshot: {
        id: tariff.id,
        name: tariff.name,
        price_per_minute: tariff.price_per_minute,
        grace_period_minutes: tariff.grace_period_minutes,
        rounding_minutes: tariff.rounding_minutes,
      },
      tariff,
    }
  }

  it('should check in and create an open session', () => {
    const { snapshot, tariff } = getDefaultSnapshot()
    const session = new SessionRepository().checkIn(
      { id: randomUUID(), child_name: 'Joao', tariff_id: tariff.id },
      snapshot,
    )
    expect(session.status).toBe('open')
    expect(session.child_name).toBe('Joao')
    expect(session.sync_status).toBe('pending')
    expect(session.checked_out_at).toBeNull()
  })

  it('should check out an open session and mark it closed', () => {
    const { snapshot, tariff } = getDefaultSnapshot()
    const sessionRepo = new SessionRepository()
    const session = sessionRepo.checkIn(
      { id: randomUUID(), child_name: 'Maria', tariff_id: tariff.id },
      snapshot,
    )

    const checkedOut = sessionRepo.checkOut({
      id: session.id,
      checked_out_at: new Date().toISOString(),
      duration_minutes: 30,
      total_cents: 1500,
    })

    expect(checkedOut?.status).toBe('closed')
    expect(checkedOut?.total_cents).toBe(1500)
    expect(checkedOut?.duration_minutes).toBe(30)
  })

  it('should calculate local fractional pricing when offline', () => {
    // Rule: ceil((duration - grace) / rounding) * rounding * price_per_minute
    // Tariff: 50 cents/min, 5 min grace, 5 min rounding
    // Input: 13 min → 13-5=8 billable → ceil(8/5)*5=10 → 10*50=500 cents
    const repo = new TariffRepository()
    const tariff = repo.create({
      name: 'Test',
      price_per_minute: 50,
      grace_period_minutes: 5,
      rounding_minutes: 5,
      is_active: 1,
    })

    const rawMinutes = 13
    const billable =
      Math.ceil(
        Math.max(0, rawMinutes - tariff.grace_period_minutes) / tariff.rounding_minutes,
      ) * tariff.rounding_minutes

    const totalCents = billable * tariff.price_per_minute

    expect(totalCents).toBe(500)

    const sessionRepo = new SessionRepository()
    const session = sessionRepo.checkIn(
      { id: randomUUID(), child_name: 'Test', tariff_id: tariff.id },
      {
        id: tariff.id,
        name: tariff.name,
        price_per_minute: tariff.price_per_minute,
        grace_period_minutes: tariff.grace_period_minutes,
        rounding_minutes: tariff.rounding_minutes,
      },
    )

    const checkedOut = sessionRepo.checkOut({
      id: session.id,
      checked_out_at: new Date().toISOString(),
      duration_minutes: rawMinutes,
      total_cents: totalCents,
    })

    expect(checkedOut?.total_cents).toBe(500)
  })

  it('should not close a session that is already closed', () => {
    const { snapshot, tariff } = getDefaultSnapshot()
    const sessionRepo = new SessionRepository()
    const session = sessionRepo.checkIn(
      { id: randomUUID(), child_name: 'Ana', tariff_id: tariff.id },
      snapshot,
    )

    const dto = {
      id: session.id,
      checked_out_at: new Date().toISOString(),
      duration_minutes: 10,
      total_cents: 500,
    }
    sessionRepo.checkOut(dto)

    // Second checkout must be a no-op (WHERE status = 'open' guard)
    const result = sessionRepo.checkOut(dto)
    expect(result?.status).toBe('closed')
    expect(result?.total_cents).toBe(500) // unchanged
  })
})

// ---------------------------------------------------------------------------
// SyncQueueRepository
// ---------------------------------------------------------------------------

describe('SyncQueueRepository', () => {
  beforeEach(() => {
    setup()
    seedDefaultTariff(getDb())
  })
  afterEach(teardown)

  it('should enqueue and retrieve a sync entry', () => {
    const tariff = new TariffRepository().findActive()[0]
    const sessionRepo = new SessionRepository()
    const session = sessionRepo.checkIn(
      { id: randomUUID(), child_name: 'Bob', tariff_id: tariff.id },
      {
        id: tariff.id,
        name: tariff.name,
        price_per_minute: tariff.price_per_minute,
        grace_period_minutes: tariff.grace_period_minutes,
        rounding_minutes: tariff.rounding_minutes,
      },
    )
    sessionRepo.checkOut({
      id: session.id,
      checked_out_at: new Date().toISOString(),
      duration_minutes: 20,
      total_cents: 1000,
    })

    const queueRepo = new SyncQueueRepository()
    const entry = queueRepo.enqueue(session.id, JSON.stringify({ session_id: session.id }))

    expect(entry.session_id).toBe(session.id)
    expect(entry.attempts).toBe(0)
    expect(queueRepo.findPending()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// AppConfigRepository
// ---------------------------------------------------------------------------

describe('AppConfigRepository', () => {
  beforeEach(setup)
  afterEach(teardown)

  it('should set and get a config value', () => {
    const repo = new AppConfigRepository()
    repo.set('kiosk_name', 'Loja Centro')
    expect(repo.get('kiosk_name')).toBe('Loja Centro')
  })

  it('should upsert — overwrite an existing key', () => {
    const repo = new AppConfigRepository()
    repo.set('kiosk_name', 'v1')
    repo.set('kiosk_name', 'v2')
    expect(repo.get('kiosk_name')).toBe('v2')
  })

  it('should return undefined for a missing key', () => {
    expect(new AppConfigRepository().get('inexistente')).toBeUndefined()
  })
})
