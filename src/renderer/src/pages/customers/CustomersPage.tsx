import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Customer, CustomerWithGuardians } from '@shared/types/db'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { CustomerModal } from './CustomerModal'

// Debounce delay for the search input (ms).
const SEARCH_DEBOUNCE_MS = 300

export function CustomersPage(): React.JSX.Element {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithGuardians | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState<string | null>(null)

  const loadCustomers = useCallback(
    async (query: string): Promise<void> => {
      setLoading(true)
      try {
        const result = await window.api.db.searchCustomers({ query })
        if (result.success) {
          setCustomers(result.data)
        } else {
          toast.error(t('customers.errorLoad', { error: result.error }))
        }
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  // Initial load
  useEffect(() => {
    void loadCustomers('')
  }, [loadCustomers])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout((): void => void loadCustomers(searchQuery), SEARCH_DEBOUNCE_MS)
    return (): void => clearTimeout(timer)
  }, [searchQuery, loadCustomers])

  const handleRowClick = async (id: string): Promise<void> => {
    setLoadingCustomer(id)
    try {
      const result = await window.api.db.getCustomer(id)
      if (result.success) {
        setEditingCustomer(result.data)
        setModalOpen(true)
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoadingCustomer(null)
    }
  }

  const handleSaved = (saved: CustomerWithGuardians): void => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id)
      const simple: Customer = {
        id: saved.id,
        name: saved.name,
        date_of_birth: saved.date_of_birth,
        notes: saved.notes,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      }
      return idx >= 0 ? prev.with(idx, simple) : [simple, ...prev]
    })
    setModalOpen(false)
    setEditingCustomer(null)
  }

  const handleNewClick = (): void => {
    setEditingCustomer(null)
    setModalOpen(true)
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900">{t('customers.title')}</h1>
        <Button onClick={handleNewClick}>{t('customers.newButton')}</Button>
      </div>

      {/* Search */}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('customers.searchPlaceholder')}
        aria-label={t('customers.searchPlaceholder')}
        className="w-full max-w-sm rounded-kiosk border border-surface-300 bg-surface-100 px-3 py-2 text-base text-surface-900 outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1"
      />

      {/* List */}
      {customers.length === 0 && !loading ? (
        <EmptyState
          title={t('customers.emptyTitle')}
          description={t('customers.emptyDescription')}
        />
      ) : (
        <div className="overflow-hidden rounded-kiosk border border-surface-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-100 text-surface-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">{t('customers.fieldName')}</th>
                <th className="px-4 py-3 font-medium">{t('customers.fieldDateOfBirth')}</th>
                <th className="px-4 py-3 font-medium">{t('customers.fieldNotes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => void handleRowClick(c.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && void handleRowClick(c.id)}
                  aria-busy={loadingCustomer === c.id}
                  className="cursor-pointer bg-white hover:bg-surface-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400"
                >
                  <td className="px-4 py-3 font-medium text-surface-900">
                    <div className="flex items-center gap-2">
                      {loadingCustomer === c.id && <Spinner size="sm" />}
                      {c.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-600">{c.date_of_birth ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600 max-w-xs truncate">{c.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <CustomerModal
        open={modalOpen}
        customer={editingCustomer}
        onClose={() => {
          setModalOpen(false)
          setEditingCustomer(null)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}
