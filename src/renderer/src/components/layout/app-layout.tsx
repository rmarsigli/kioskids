/**
 * AppLayout — top-level shell for all routes.
 *
 * Header: app name (link to /sessions), "Novo Check-in" button, hamburger
 * dropdown (Histórico, Tarifas, Clientes), and a Settings gear icon.
 *
 * The CheckIn modal lives here — it persists across route changes and
 * dispatches a `sessions:refresh` DOM event on success so the dashboard
 * can reload its lists immediately without waiting for the 30-second interval.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogHeader } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { CheckInForm } from '@renderer/pages/check-in/check-in-page'
import { RENDERER_EVENTS } from '@renderer/lib/events'

// ---------------------------------------------------------------------------
// Hamburger dropdown navigation
// ---------------------------------------------------------------------------

interface HamburgerItem {
  to: string
  labelKey: 'nav.history' | 'nav.tariffs' | 'nav.customers'
}

const HAMBURGER_ITEMS: readonly HamburgerItem[] = [
  { to: '/history', labelKey: 'nav.history' },
  { to: '/tariffs', labelKey: 'nav.tariffs' },
  { to: '/customers', labelKey: 'nav.customers' },
]

/** Shared Tailwind class for small icon-only buttons in the header. */
const ICON_BTN_CLASS =
  'rounded-kiosk p-2 text-surface-700 transition-colors ' +
  'hover:bg-surface-200 hover:text-surface-900 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'

function HamburgerMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  // Close on any outside click while the menu is open.
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return (): void => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={open ? t('header.closeMenuAriaLabel') : t('header.menuAriaLabel')}
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className={ICON_BTN_CLASS}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <nav
          role="menu"
          aria-label={t('nav.mainLabel')}
          className={
            'absolute right-0 top-full z-50 mt-1 min-w-[10rem] ' +
            'rounded-kiosk border border-surface-300 bg-surface-50 py-1 shadow-lg'
          }
        >
          {HAMBURGER_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              activeProps={{ 'aria-current': 'page' as const }}
              activeOptions={{ exact: false }}
              className={
                'block px-4 py-2.5 text-sm font-medium text-surface-700 ' +
                'hover:bg-surface-200 hover:text-surface-900 transition-colors'
              }
              activeClassName="bg-brand-500/10 text-brand-700"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppLayout
// ---------------------------------------------------------------------------

export function AppLayout(): React.JSX.Element {
  const { t } = useTranslation()
  const [checkInOpen, setCheckInOpen] = useState(false)

  const handleCheckInSuccess = useCallback(() => {
    setCheckInOpen(false)
    // Signal the dashboard to refresh immediately instead of waiting for the
    // automatic 30-second polling interval.
    window.dispatchEvent(new Event(RENDERER_EVENTS.SESSIONS_REFRESH))
  }, [])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-surface-0">
      {/* ── Fixed top header ───────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-surface-300 bg-surface-50 px-4 shadow-sm">
        <Link
          to="/sessions"
          className={
            'mr-auto text-lg font-bold tracking-tight text-surface-900 ' +
            'hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 ' +
            'focus-visible:ring-brand-400 rounded'
          }
        >
          KiosKids
        </Link>

        <Button
          size="sm"
          onClick={() => setCheckInOpen(true)}
          aria-label={t('header.newCheckInAriaLabel')}
        >
          {t('header.newCheckIn')}
        </Button>

        <HamburgerMenu />

        <button
          type="button"
          aria-label={t('header.settingsAriaLabel')}
          className={ICON_BTN_CLASS}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      </header>

      {/* ── Page content ──────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      {/* ── Check-in modal (persists across route changes) ─────────── */}
      <Dialog
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        size="md"
        ariaLabel={t('checkIn.title')}
      >
        <DialogHeader title={t('checkIn.title')} onClose={() => setCheckInOpen(false)} />
        <CheckInForm
          onSuccess={handleCheckInSuccess}
          onCancel={() => setCheckInOpen(false)}
        />
      </Dialog>
    </div>
  )
}
