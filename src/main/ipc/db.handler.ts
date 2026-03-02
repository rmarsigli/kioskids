import { ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type { Tariff, Session, PreviewCheckoutResult } from '@shared/types/db'
import { parseTariffSnapshot } from '@shared/types/db'
import { SaveTariffSchema } from '@shared/utils/tariff-schema'
import { CheckInRequestSchema } from '@shared/utils/check-in-schema'
import { calculateSessionTotal, TariffSnapshotSchema } from '@shared/utils/tariff-engine'
import { nowIso } from '@shared/utils/time'
import { TariffRepository, SessionRepository } from '../database'

const tariffRepo = new TariffRepository()
const sessionRepo = new SessionRepository()

/** Single UUID schema reused by checkout, preview-checkout, and cancel-session handlers. */
const SessionIdSchema = z.object({ id: z.string().uuid() })

/** Zod schema for canceling a session with an optional human-readable reason. */
const CancelSessionSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export function registerDbHandlers(): void {
  // Opens a new session: validates input, confirms tariff is still active,
  // then inserts session + sync_queue row in a single transaction.
  ipcMain.handle(
    IPC.DB.CHECK_IN,
    (_, dto: unknown): IpcResult<Session> => {
      const parsed = CheckInRequestSchema.safeParse(dto)
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.errors.map((e) => e.message).join('; '),
          code: 'VALIDATION_ERROR',
        }
      }

      try {
        const tariff = tariffRepo.findById(parsed.data.tariff_id)
        if (!tariff) {
          return { success: false, error: 'Tarifa nao encontrada.', code: 'NOT_FOUND' }
        }
        if (tariff.is_active !== 1) {
          return {
            success: false,
            error: 'A tarifa selecionada nao esta mais ativa.',
            code: 'TARIFF_INACTIVE',
          }
        }

        const snapshot = TariffSnapshotSchema.parse({
          id: tariff.id,
          name: tariff.name,
          base_price: tariff.base_price,
          base_minutes: tariff.base_minutes,
          additional_fraction_price: tariff.additional_fraction_price,
          additional_fraction_minutes: tariff.additional_fraction_minutes,
          tolerance_minutes: tariff.tolerance_minutes,
        })

        const session = sessionRepo.checkIn(
          { id: randomUUID(), ...parsed.data },
          snapshot,
        )

        return { success: true, data: session }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )

  // Returns all open sessions — used by the live dashboard.
  ipcMain.handle(IPC.DB.GET_ACTIVE_SESSIONS, (): IpcResult<Session[]> => {
    try {
      return { success: true, data: sessionRepo.findOpen() }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Closes a session: Main sets the timestamp, calculates totals from the stored snapshot.
  ipcMain.handle(
    IPC.DB.CHECK_OUT,
    (_, dto: unknown): IpcResult<Session> => {
      const parsed = SessionIdSchema.safeParse(dto)
      if (!parsed.success) {
        return { success: false, error: 'ID de sessao invalido.', code: 'VALIDATION_ERROR' }
      }

      const { id } = parsed.data

      try {
        const session = sessionRepo.findById(id)
        if (!session) {
          return { success: false, error: 'Sessao nao encontrada.', code: 'NOT_FOUND' }
        }
        if (session.status !== 'open') {
          return { success: false, error: 'Sessao ja encerrada.', code: 'SESSION_CLOSED' }
        }

        const tariff = parseTariffSnapshot(session.tariff_snapshot)
        const checkedOutAt = nowIso()
        const durationMs =
          new Date(checkedOutAt).getTime() - new Date(session.checked_in_at).getTime()
        const durationMinutes = Math.ceil(durationMs / 60_000)
        const totalCents = calculateSessionTotal(session.checked_in_at, checkedOutAt, tariff)

        const closed = sessionRepo.checkOut({
          id,
          checked_out_at: checkedOutAt,
          duration_minutes: durationMinutes,
          total_cents: totalCents,
        })

        if (!closed) {
          return { success: false, error: 'Sessao nao encontrada.', code: 'NOT_FOUND' }
        }

        return { success: true, data: closed }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )

  // Returns estimated billing total and elapsed time WITHOUT writing any data.
  // The Renderer uses this to show a confirmation screen before the real checkout.
  // Returns CLOCK_ERROR when the system clock appears to have gone backwards.
  ipcMain.handle(
    IPC.DB.PREVIEW_CHECKOUT,
    (_, dto: unknown): IpcResult<PreviewCheckoutResult> => {
      const parsed = SessionIdSchema.safeParse(dto)
      if (!parsed.success) {
        return { success: false, error: 'ID de sessao invalido.', code: 'VALIDATION_ERROR' }
      }

      try {
        const session = sessionRepo.findById(parsed.data.id)
        if (!session) {
          return { success: false, error: 'Sessao nao encontrada.', code: 'NOT_FOUND' }
        }
        if (session.status !== 'open') {
          return { success: false, error: 'Sessao ja encerrada.', code: 'SESSION_CLOSED' }
        }

        const tariff = parseTariffSnapshot(session.tariff_snapshot)
        const nowStr = nowIso()
        const durationMs =
          new Date(nowStr).getTime() - new Date(session.checked_in_at).getTime()

        if (durationMs < 0) {
          return {
            success: false,
            error: 'Relogio do sistema incorreto (checkout antes do check-in).',
            code: 'CLOCK_ERROR',
          }
        }

        const elapsedMinutes = Math.ceil(durationMs / 60_000)
        const previewTotal = calculateSessionTotal(session.checked_in_at, nowStr, tariff)

        return {
          success: true,
          data: {
            session_id: session.id,
            child_name: session.child_name,
            guardian_name: session.guardian_name,
            tariff_name: tariff.name,
            checked_in_at: session.checked_in_at,
            elapsed_minutes: elapsedMinutes,
            preview_total: previewTotal,
          },
        }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )

  // Marks an open session as canceled. Does not set billing totals.
  // Stores an optional human-readable reason in the `notes` column.
  ipcMain.handle(
    IPC.DB.CANCEL_SESSION,
    (_, dto: unknown): IpcResult<Session> => {
      const parsed = CancelSessionSchema.safeParse(dto)
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.errors.map((e) => e.message).join('; '),
          code: 'VALIDATION_ERROR',
        }
      }

      try {
        const session = sessionRepo.findById(parsed.data.id)
        if (!session) {
          return { success: false, error: 'Sessao nao encontrada.', code: 'NOT_FOUND' }
        }
        if (session.status !== 'open') {
          return { success: false, error: 'Sessao ja encerrada.', code: 'SESSION_CLOSED' }
        }

        const canceled = sessionRepo.cancel(parsed.data.id, parsed.data.notes)
        if (!canceled) {
          return { success: false, error: 'Sessao nao encontrada.', code: 'NOT_FOUND' }
        }

        return { success: true, data: canceled }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )

  // Returns active tariffs only — used by the check-in dropdown.
  ipcMain.handle(IPC.DB.GET_TARIFFS, (): IpcResult<Tariff[]> => {
    try {
      return { success: true, data: tariffRepo.findActive() }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Returns all tariffs (active + inactive) — used by the management page.
  ipcMain.handle(IPC.DB.GET_ALL_TARIFFS, (): IpcResult<Tariff[]> => {
    try {
      return { success: true, data: tariffRepo.findAll() }
    } catch (err) {
      return { success: false, error: String(err), code: 'DB_ERROR' }
    }
  })

  // Create or update a tariff. Zod-validates the DTO before touching the DB.
  ipcMain.handle(
    IPC.DB.SAVE_TARIFF,
    (_, dto: unknown): IpcResult<Tariff> => {
      const parsed = SaveTariffSchema.safeParse(dto)
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.errors.map((e) => e.message).join('; '),
          code: 'VALIDATION_ERROR',
        }
      }
      try {
        return { success: true, data: tariffRepo.save(parsed.data) }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )

  // Soft-delete: sets is_active = 0. Rejects when it would leave zero active tariffs.
  ipcMain.handle(
    IPC.DB.DEACTIVATE_TARIFF,
    (_, id: unknown): IpcResult<void> => {
      if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
        return { success: false, error: 'ID invalido.', code: 'VALIDATION_ERROR' }
      }
      try {
        const active = tariffRepo.findActive()
        if (active.length <= 1 && active[0]?.id === id) {
          return {
            success: false,
            error: 'Nao e possivel desativar a unica tarifa ativa.',
            code: 'LAST_ACTIVE_TARIFF',
          }
        }
        const changed = tariffRepo.deactivate(id)
        if (!changed) return { success: false, error: 'Tarifa nao encontrada.', code: 'NOT_FOUND' }
        return { success: true, data: undefined }
      } catch (err) {
        return { success: false, error: String(err), code: 'DB_ERROR' }
      }
    },
  )
}
