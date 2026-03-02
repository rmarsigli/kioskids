/**
 * SessionsPage — the main two-column dashboard.
 *
 * Left panel : today's sessions table (all statuses)
 * Right panel : active session cards (countdown/overtime) + info widget
 *
 * Refreshes every 30 s automatically, and immediately on the synthetic
 * `sessions:refresh` DOM event dispatched by AppLayout after a check-in.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Session } from '@shared/types/db'
import { parseTariffSnapshot } from '@shared/types/db'
import { formatRs } from '@shared/utils/currency'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useSessionTimer } from '../../hooks/useSessionTimer'
import { playBeep } from '../../lib/beep'
import { cn } from '../../lib/cn'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 30_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// ActiveSessionCard — countdown/overtime card for the right panel
// ---------------------------------------------------------------------------

interface ActiveCardProps {
  session: Session
  onCheckOut: (id: string) => void
  onNotify: (id: string) => void
}

function ActiveSessionCardInner({ session, onCheckOut, onNotify }: ActiveCardProps): React.JSX.Element {
  const { t } = useTranslation()
  const tariff = useMemo(() => parseTariffSnapshot(session.tariff_snapshot), [session.tariff_snapshot])
  const { isOverTolerance, liveCost, countdownDisplay, overtimeDisplay } = useSessionTimer(
    session.checked_in_at,
    tariff,
  )

  // Beep exactly once when the session first transitions to over-tolerance.
  const prevOverRef = useRef(false)
  useEffect(() => {
    if (isOverTolerance && !prevOverRef.current) {
      playBeep()
    }
    prevOverRef.current = isOverTolerance
  }, [isOverTolerance])

  return (
    <article
      aria-label={t('activeCard.checkOutAriaLabel', { name: session.child_name })}
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-3 shadow-sm transition-colors',
        isOverTolerance
          ? 'border-danger-400 bg-danger-50'
          : 'border-surface-200 bg-surface-50',
      )}
    >
      {/* Name + overtime badge */}
      <div className="flex items-start justify-between gap-2">
        <p className={cn('truncate text-sm font-bold', isOverTolerance ? 'text-danger-700' : 'text-surface-900')}>
          {session.child_name}
        </p>
        {isOverTolerance && (
          <span
            aria-label={t('activeCard.overtimeAriaLabel')}
            className="shrink-0 rounded-full bg-danger-100 px-2 py-0.5 text-xs font-semibold text-danger-700"
          >
            {t('activeCard.overtimeBadge')}
          </span>
        )}
      </div>

      {/* Timer */}
      <div className="flex items-baseline gap-1.5">
        <span
          aria-label={t('activeCard.timerAriaLabel', { display: isOverTolerance ? overtimeDisplay : countdownDisplay })}
          className={cn(
            'font-mono text-2xl font-extrabold tabular-nums leading-none',
            isOverTolerance ? 'text-danger-700' : 'text-surface-800',
          )}
        >
          {isOverTolerance ? overtimeDisplay : countdownDisplay}
        </span>
        <span className={cn('text-xs', isOverTolerance ? 'text-danger-500' : 'text-surface-400')}>
          {t(isOverTolerance ? 'activeCard.overtimeLabel' : 'activeCard.countdownLabel')}
        </span>
      </div>

      {/* Live cost + tariff */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-400">{tariff.name}</span>
        <span
          aria-label={t('activeCard.costAriaLabel', { cost: formatRs(liveCost) })}
          className="text-sm font-semibold text-surface-700"
        >
          {formatRs(liveCost)}
        </span>
      </div>

      {/* Actions */}
      <footer className="flex gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onCheckOut(session.id)}
          aria-label={t('activeCard.checkOutAriaLabel', { name: session.child_name })}
        >
          {t('activeCard.checkOutButton')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => onNotify(session.id)}
          aria-label={t('activeCard.notifyAriaLabel', { name: session.child_name })}
        >
          {t('activeCard.notifyButton')}
        </Button>
      </footer>
    </article>
  )
}

const ActiveSessionCard = React.memo(ActiveSessionCardInner)

// ---------------------------------------------------------------------------
// TodaySessionRow — one row in the today's sessions table
// ---------------------------------------------------------------------------

interface TodayRowProps {
  session: Session
}

function TodaySessionRow({ session }: TodayRowProps): React.JSX.Element {
  const { t } = useTranslation()

  const tariffName = useMemo(() => {
    try {
      return parseTariffSnapshot(session.tariff_snapshot).name
    } catch {
      return '—'
    }
  }, [session.tariff_snapshot])

  const statusLabel: Record<Session['status'], string> = {
    open: t('dashboard.statusOpen'),
    closed: t('dashboard.statusClosed'),
    canceled: t('dashboard.statusCanceled'),
  }

  const statusClass: Record<Session['status'], string> = {
    open: 'bg-brand-100 text-brand-700',
    closed: 'bg-surface-200 text-surface-700',
    canceled: 'bg-danger-100 text-danger-700',
  }

  return (
    <tr className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
      <td className="whitespace-nowrap px-3 py-2 text-sm text-surface-600">
        {formatTime(session.checked_in_at)}
      </td>
      <td className="px-3 py-2 text-sm font-medium text-surface-900">
        {session.child_name}
      </td>
      <td className="px-3 py-2 text-sm text-surface-600">
        {session.guardian_name ?? '—'}
      </td>
      <td className="px-3 py-2 text-sm text-surface-600">{tariffName}</td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-surface-600">
        {session.duration_minutes != null
          ? t('dashboard.durationMinutes', { minutes: session.duration_minutes })
          : '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-surface-800">
        {session.total_cents != null ? formatRs(session.total_cents) : '—'}
      </td>
      <td className="px-3 py-2">
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', statusClass[session.status])}>
          {statusLabel[session.status]}
        </span>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// InfoWidget — version, live clock, support contact
// ---------------------------------------------------------------------------

function InfoWidget(): React.JSX.Element {
  const { t } = useTranslation()
  const [version, setVersion] = useState<string>('…')
  const [clock, setClock] = useState<string>('')

  useEffect(() => {
    window.api.app.getVersion()
      .then((res) => { if (res.success) setVersion(res.data) })
      .catch(() => { /* non-critical — keep placeholder */ })
  }, [])

  // Live clock — 1-second tick.
  useEffect(() => {
    const tick = (): void => {
      setClock(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1_000)
    return (): void => clearInterval(id)
  }, [])

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-600">
      <p className="mb-2 font-semibold text-surface-800">{t('infoWidget.title')}</p>
      <p className="font-mono text-lg font-bold text-surface-900 tabular-nums">{clock}</p>
      <p className="mt-1 text-xs">{t('infoWidget.appVersion', { version })}</p>
      <p className="mt-2 text-xs">
        <span className="font-medium">{t('infoWidget.supportLabel')}: </span>
        {t('infoWidget.supportContact')}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SessionsPage — the main dashboard
// ---------------------------------------------------------------------------

export function SessionsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadRef = useRef<() => Promise<void>>()

  const load = useCallback(async (): Promise<void> => {
    const [activeRes, todayRes] = await Promise.all([
      window.api.db.getActiveSessions(),
      window.api.db.getTodaySessions(),
    ])

    if (activeRes.success) {
      setActiveSessions(activeRes.data)
    } else {
      toast.error(t('dashboard.errorLoad', { error: activeRes.error }))
    }

    if (todayRes.success) {
      setTodaySessions(todayRes.data)
    }

    setLoading(false)
  }, [t])

  loadRef.current = load

  // Initial load + 30-second auto-refresh.
  useEffect((): (() => void) => {
    void load()
    const id = setInterval(() => void loadRef.current?.(), REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  // Immediate refresh requested by AppLayout after a successful check-in.
  useEffect((): (() => void) => {
    const handler = (): void => { void loadRef.current?.() }
    window.addEventListener('sessions:refresh', handler)
    return () => window.removeEventListener('sessions:refresh', handler)
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCheckOut = useCallback((id: string): void => {
    void navigate({ to: '/sessions/$id/checkout', params: { id } })
  }, [navigate])

  const handleNotify = useCallback((id: string): void => {
    toast.info(t('sessions.notifyPending', { id: id.slice(0, 8) }))
  }, [t])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel — today's sessions table ──────────────────── */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-surface-200">
        <div className="flex shrink-0 items-center px-4 py-3 border-b border-surface-100">
          <h2 className="text-sm font-bold text-surface-800">{t('dashboard.todayPanelTitle')}</h2>
        </div>

        <div className="overflow-y-auto flex-1">
          {todaySessions.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                title={t('dashboard.emptyTodayTitle')}
                description={t('dashboard.emptyTodayDescription')}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-surface-100 text-xs font-semibold uppercase text-surface-500">
                <tr>
                  <th className="px-3 py-2">{t('dashboard.colTime')}</th>
                  <th className="px-3 py-2">{t('dashboard.colName')}</th>
                  <th className="px-3 py-2">{t('dashboard.colGuardian')}</th>
                  <th className="px-3 py-2">{t('dashboard.colTariff')}</th>
                  <th className="px-3 py-2">{t('dashboard.colDuration')}</th>
                  <th className="px-3 py-2">{t('dashboard.colTotal')}</th>
                  <th className="px-3 py-2">{t('dashboard.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {todaySessions.map((session) => (
                  <TodaySessionRow key={session.id} session={session} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Right panel — active cards + info widget ─────────────── */}
      <section className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto p-3">
        {/* Active sessions header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-surface-800">{t('dashboard.activePanelTitle')}</h2>
          {activeSessions.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {activeSessions.length}
            </span>
          )}
        </div>

        {activeSessions.length === 0 ? (
          <EmptyState
            title={t('dashboard.emptyActiveTitle')}
            description={t('dashboard.emptyActiveDescription')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            }
          />
        ) : (
          <ul role="list" className="flex flex-col gap-2">
            {activeSessions.map((session) => (
              <li key={session.id}>
                <ActiveSessionCard
                  session={session}
                  onCheckOut={handleCheckOut}
                  onNotify={handleNotify}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Info widget — always visible at the bottom */}
        <div className="mt-auto pt-2">
          <InfoWidget />
        </div>
      </section>
    </div>
  )
}
