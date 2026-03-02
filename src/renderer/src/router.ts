import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { SessionsPage } from './pages/sessions/SessionsPage'
import { CheckInPage } from './pages/check-in/CheckInPage'
import { HistoryPage } from './pages/history/HistoryPage'
import { TariffsPage } from './pages/tariffs/TariffsPage'
import { CheckOutPage } from './pages/sessions/CheckOutPage'

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

const rootRoute = createRootRoute({
  component: AppLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/check-in' })
  },
})

const checkInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/check-in',
  component: CheckInPage,
})

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  component: SessionsPage,
})

export const checkOutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions/$id/checkout',
  component: CheckOutPage,
})

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
})

const tariffsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tariffs',
  component: TariffsPage,
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const routeTree = rootRoute.addChildren([
  indexRoute,
  checkInRoute,
  sessionsRoute,
  checkOutRoute,
  historyRoute,
  tariffsRoute,
])

export const router = createRouter({ routeTree })

// Type augmentation for TanStack Router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
