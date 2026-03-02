import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Tariff } from '@shared/types/db'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { TariffCard } from './TariffCard'
import { TariffForm } from './TariffForm'

type FormMode = 'create' | { edit: Tariff } | null

export function TariffsPage(): React.JSX.Element {
  const { t } = useTranslation()
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  const loadTariffs = useCallback(async (): Promise<void> => {
    try {
      const result = await window.api.db.getAllTariffs()
      if (result.success) {
        setTariffs(result.data)
      } else {
        toast.error(t('tariffs.errorLoad', { error: result.error }))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadTariffs()
  }, [loadTariffs])

  const handleSaveSuccess = (saved: Tariff): void => {
    setTariffs((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id)
      return idx >= 0 ? prev.with(idx, saved) : [saved, ...prev]
    })
    setFormMode(null)
  }

  const handleDeactivate = async (id: number): Promise<void> => {
    setDeactivatingId(id)
    const result = await window.api.db.deactivateTariff(id)
    setDeactivatingId(null)
    if (result.success) {
      setTariffs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: 0 as const } : t)),
      )
      toast.success(t('tariffs.successDeactivate'))
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{t('tariffs.title')}</h1>
        {formMode === null && (
          <Button onClick={() => setFormMode('create')}>{t('tariffs.newTariffButton')}</Button>
        )}
      </div>

      {/* Inline form */}
      {formMode !== null && (
        <TariffForm
          tariff={formMode === 'create' ? undefined : formMode.edit}
          onSuccess={handleSaveSuccess}
          onCancel={() => setFormMode(null)}
        />
      )}

      {/* List */}
      {tariffs.length === 0 ? (
        <EmptyState
          title={t('tariffs.emptyTitle')}
          description={t('tariffs.emptyDescription')}
          action={
            formMode === null ? (
              <Button size="lg" onClick={() => setFormMode('create')}>
                {t('tariffs.emptyAction')}
              </Button>
            ) : undefined
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"
              />
            </svg>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {tariffs.map((tariff) => (
            <TariffCard
              key={tariff.id}
              tariff={tariff}
              onEdit={(t) => setFormMode({ edit: t })}
              onDeactivate={(id) => void handleDeactivate(id)}
              deactivating={deactivatingId === tariff.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

