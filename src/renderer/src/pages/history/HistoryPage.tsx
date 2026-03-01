import React from 'react'
import { EmptyState } from '../../components/ui/EmptyState'

export function HistoryPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Histórico</h1>
      </div>

      <EmptyState
        title="Nenhuma sessão registrada"
        description="O histórico de sessões encerradas aparecerá aqui."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        }
      />
    </div>
  )
}
