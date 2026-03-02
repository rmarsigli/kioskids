import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { parseTariffSnapshot } from '@shared/types/db'
import type { Session } from '@shared/types/db'
import { formatRs } from '@shared/utils/currency'
import { cn } from '../../lib/cn'
import { Button } from '../../components/ui/Button'
import { useSessionTimer } from '../../hooks/useSessionTimer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionCardProps {
  session: Session
  onCheckOut: (id: string) => void
  onNotify: (id: string) => void
  /** Disables the Check-Out button and shows a spinner while the action runs. */
  isCheckingOut?: boolean
}

// ---------------------------------------------------------------------------
// Component (inner — wrapped in React.memo below)
// ---------------------------------------------------------------------------

function SessionCardInner({
  session,
  onCheckOut,
  onNotify,
  isCheckingOut = false,
}: SessionCardProps): React.JSX.Element {
  const { t } = useTranslation()
  // Memoised: tariff_snapshot is an immutable string captured at check-in.
  // Parsing only re-runs when the session row itself changes (i.e., never while open).
  const tariff = useMemo(
    () => parseTariffSnapshot(session.tariff_snapshot),
    [session.tariff_snapshot],
  )
  const { elapsedDisplay, isOverTolerance, liveCost } = useSessionTimer(
    session.checked_in_at,
    tariff,
  )

  return (
    <article
      aria-label={t('sessionCard.sessionAriaLabel', { name: session.child_name })}
      className={cn(
        'flex flex-col gap-4 rounded-2xl border bg-surface-50 p-5 shadow-sm',
        isOverTolerance
          ? 'border-warning-400 bg-warning-50'
          : 'border-surface-200',
      )}
    >
      {/* Header: name + tolerance badge */}
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-surface-900">{session.child_name}</p>
          {session.guardian_name && (
            <p className="truncate text-sm text-surface-500">{session.guardian_name}</p>
          )}
        </div>

        {isOverTolerance && (
          <span
            aria-label={t('sessionCard.overToleranceAriaLabel')}
            className="shrink-0 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-semibold text-warning-700"
          >
            {t('sessionCard.overToleranceBadge')}
          </span>
        )}
      </header>

      {/* Elapsed + live cost */}
      <div className="flex items-baseline justify-between gap-4">
        <span
          aria-label={t('sessionCard.elapsedAriaLabel', { elapsed: elapsedDisplay })}
          className={cn(
            'font-mono text-3xl font-extrabold tabular-nums leading-none',
            isOverTolerance ? 'text-warning-700' : 'text-surface-800',
          )}
        >
          {elapsedDisplay}
        </span>

        <span
          aria-label={t('sessionCard.costAriaLabel', { cost: formatRs(liveCost) })}
          className="text-xl font-semibold text-surface-700"
        >
          {formatRs(liveCost)}
        </span>
      </div>

      {/* Tariff name as context */}
      <p className="text-xs text-surface-400 -mt-2">{tariff.name}</p>

      {/* Actions — min 48 px height per WCAG touch target guideline */}
      <footer className="flex gap-3">
        <Button
          variant="primary"
          size="md"
          className="flex-1 min-h-[3rem]"
          onClick={() => onCheckOut(session.id)}
          loading={isCheckingOut}
          disabled={isCheckingOut}
          aria-label={t('sessionCard.checkOutAriaLabel', { name: session.child_name })}
        >
          {t('sessionCard.checkOutButton')}
        </Button>

        <Button
          variant="ghost"
          size="md"
          className="flex-1 min-h-[3rem]"
          onClick={() => onNotify(session.id)}
          disabled={isCheckingOut}
          aria-label={t('sessionCard.notifyAriaLabel', { name: session.child_name })}
        >
          {t('sessionCard.notifyButton')}
        </Button>
      </footer>
    </article>
  )
}

/**
 * SessionCard displays a live-updating timer and current cost for an open session.
 * Memoised so only sessions that changed re-render (the parent refreshes the full list).
 */
export const SessionCard = React.memo(SessionCardInner)
