import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/constants/ipc-channels'
import type { IpcResult } from '@shared/types/result'
import type { Tariff, Session } from '@shared/types/db'
import { parseTariffSnapshot } from '@shared/types/db'
import { SaveTariffSchema } from '@shared/utils/tariff-schema'
import { calculateSessionTotal } from '@shared/utils/tariff-engine'
import { nowIso } from '@shared/utils/time'
import { TariffRepository, SessionRepository } from '../database'

const tariffRepo = new TariffRepository()
const sessionRepo = new SessionRepository()

/** Zod schema for the checkout request coming from the Renderer. */
const CheckoutRequestSchema = z.object({ id: z.string().uuid() })

export function registerDbHandlers(): void {
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
    IPC.DB.CHECKOUT_SESSION,
    (_, dto: unknown): IpcResult<Session> => {
      const parsed = CheckoutRequestSchema.safeParse(dto)
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
