import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppLayout } from '@renderer/components/layout/app-layout'
import { SessionsPage } from '@renderer/pages/sessions/sessions-page'
import { HistoryPage } from '@renderer/pages/history/history-page'
import { TariffsPage } from '@renderer/pages/tariffs/tariffs-page'
import { CheckOutPage } from '@renderer/pages/sessions/check-out-page'
import { CustomersPage } from '@renderer/pages/customers/customers-page'

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
