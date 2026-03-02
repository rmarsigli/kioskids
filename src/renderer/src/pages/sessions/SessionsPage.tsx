import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Session } from '@shared/types/db'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { SessionCard } from './SessionCard'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 30_000

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SessionsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Stable ref so the interval closure captures the latest function without restarting.
  const loadRef = useRef<() => Promise<void>>()

  const load = useCallback(async (): Promise<void> => {
    const result = await window.api.db.getActiveSessions()
    if (result.success) {
      setSessions(result.data)
    } else {
      toast.error(t('sessions.errorLoad', { error: result.error }))
    }
    setLoading(false)
  }, [t])

  // Keep the ref current so the interval always calls the latest version.
  loadRef.current = load

  // Initial load + 30-second refresh.
  useEffect((): (() => void) => {
    void load()

    const id = setInterval(() => void loadRef.current?.(), REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  // Navigate to the dedicated checkout page — billing confirmation happens there.
  const handleCheckOut = useCallback((id: string): void => {
    void navigate({ to: '/sessions/$id/checkout', params: { id } })
  }, [navigate])

  const handleNotify = useCallback((id: string): void => {
    // WhatsApp deep-link with session context — full implementation in TASK-011.
    toast.info(t('sessions.notifyPending', { id: id.slice(0, 8) }))
  }, [t])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t('sessions.title')}</h1>

        <Button
          size="md"
          onClick={() => void navigate({ to: '/check-in' })}
          aria-label={t('sessions.newCheckInAriaLabel')}
        >
          {t('sessions.newCheckIn')}
        </Button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title={t('sessions.emptyTitle')}
          description={t('sessions.emptyDescription')}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
          }
        />
      ) : (
        <ul
          role="list"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label={t('sessions.listAriaLabel')}>

          {sessions.map((session) => (
            <li key={session.id}>
              <SessionCard
                session={session}
                onCheckOut={handleCheckOut}
                onNotify={handleNotify}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
