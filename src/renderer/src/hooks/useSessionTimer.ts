/**
 * useSessionTimer — live elapsed time and cost for an open session.
 *
 * Elapsed time is ALWAYS derived from checkInAt minus wall-clock `Date.now()`.
 * This means the timer survives app restarts and machine sleep without drift.
 * It is NOT an accumulated counter.
 *
 * Live cost is recalculated every 60 s — billing fractions change at most once
 * per minute, so a 1-second recalc cycle would be wasteful.
 */
import { useState, useEffect } from 'react'
import { calculateLiveCost } from '@shared/utils/tariff-engine'
import type { TariffSnapshot } from '@shared/types/db'

export interface SessionTimerResult {
  /** Wall-clock seconds elapsed since checkInAt. Always >= 0. */
  elapsedSeconds: number
  /** HH:MM:SS formatted string suitable for monospace display. */
  elapsedDisplay: string
  /** True once elapsed minutes exceeds base_minutes + tolerance_minutes. */
  isOverTolerance: boolean
  /** Current estimated cost in integer cents. Refreshed every 60 s. */
  liveCost: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeElapsed(checkInAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(checkInAt).getTime()) / 1000))
}

function formatHHMMSS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSessionTimer(
  checkInAt: string,
  tariff: TariffSnapshot,
): SessionTimerResult {
  // Initialise synchronously — avoids a 0-second flash on first render.
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => computeElapsed(checkInAt))
  const [liveCost, setLiveCost] = useState<number>(() => calculateLiveCost(checkInAt, tariff))

  // 1-second tick — updates the HH:MM:SS display.
  useEffect((): (() => void) => {
    const id = setInterval((): void => {
      setElapsedSeconds(computeElapsed(checkInAt))
    }, 1_000)
    return () => clearInterval(id)
  }, [checkInAt])

  // 60-second tick — recalculates billing cost.
  // `tariff` is referentially stable because SessionCard memoises parseTariffSnapshot.
  useEffect((): (() => void) => {
    const id = setInterval((): void => {
      setLiveCost(calculateLiveCost(checkInAt, tariff))
    }, 60_000)
    return () => clearInterval(id)
  }, [checkInAt, tariff])

  const elapsedMinutes = Math.ceil(elapsedSeconds / 60)
  const isOverTolerance = elapsedMinutes > tariff.base_minutes + tariff.tolerance_minutes

  return {
    elapsedSeconds,
    elapsedDisplay: formatHHMMSS(elapsedSeconds),
    isOverTolerance,
    liveCost,
  }
}
