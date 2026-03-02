import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { SessionsPage } from './pages/sessions/SessionsPage'
import { HistoryPage } from './pages/history/HistoryPage'
import { TariffsPage } from './pages/tariffs/TariffsPage'
import { CheckOutPage } from './pages/sessions/CheckOutPage'
import { CustomersPage } from './pages/customers/CustomersPage'

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
    throw redirect({ to: '/sessions' })
  },
})

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  component: SessionsPage,
})

const checkOutRoute = createRoute({
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

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customers',
  component: CustomersPage,
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const routeTree = rootRoute.addChildren([
  indexRoute,
  sessionsRoute,
  checkOutRoute,
  historyRoute,
  tariffsRoute,
  customersRoute,
])

export const router = createRouter({ routeTree })

// Type augmentation for TanStack Router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
