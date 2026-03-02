import React from 'react'
import { Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

interface NavItem {
  to: string
  /** Scoped i18next translation key from the 'nav' namespace. */
  labelKey: 'nav.checkIn' | 'nav.sessions' | 'nav.history' | 'nav.tariffs'
  icon: React.JSX.Element
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/check-in',
    labelKey: 'nav.checkIn',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>
    ),
  },
  {
    to: '/sessions',
    labelKey: 'nav.sessions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
      </svg>
    ),
  },
  {
    to: '/history',
    labelKey: 'nav.history',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    to: '/tariffs',
    labelKey: 'nav.tariffs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
      </svg>
    ),
  },
]

const NAV_LINK_BASE =
  'flex min-h-[3rem] items-center gap-3 rounded-kiosk px-3 py-2 text-sm font-medium ' +
  'transition-colors duration-150 outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 ' +
  'text-surface-700 hover:bg-surface-200 hover:text-surface-900 active:bg-surface-300'

function SidebarNavItem({ item }: { item: NavItem }): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Link
      to={item.to}
      // TanStack Router injects aria-current and activeProps natively — no useRouterState needed
      activeProps={{ 'aria-current': 'page' as const }}
      activeOptions={{ exact: false }}
      className={NAV_LINK_BASE}
      activeClassName="bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 hover:text-brand-300"
    >
      <span aria-hidden="true">{item.icon}</span>
      {t(item.labelKey)}
    </Link>
  )
}

export function AppLayout(): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-0">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-surface-300 bg-surface-50 p-3">
        <div className="mb-4 flex items-center gap-2 px-2 py-3">
          <span className="text-lg font-bold tracking-tight text-surface-900">KiosKids</span>
        </div>

        <nav aria-label={t('nav.mainLabel')} className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.to} item={item} />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
