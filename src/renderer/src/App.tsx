import React from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { router } from './router'

export default function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: 'var(--color-surface-100)',
            border: '1px solid var(--color-surface-300)',
            color: 'var(--color-surface-900)',
          },
        }}
      />
    </ErrorBoundary>
  )
}
