import React from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../components/ui/EmptyState'

export function HistoryPage(): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t('history.title')}</h1>
      </div>

      <EmptyState
        title={t('history.emptyTitle')}
        description={t('history.emptyDescription')}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        }
      />
    </div>
  )
}
