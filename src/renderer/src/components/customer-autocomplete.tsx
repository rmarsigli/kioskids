/**
 * CustomerAutocomplete — async type-to-search input that queries the local
 * customer database and returns a selected customer record.
 *
 * The caller is responsible for pre-filling form fields from the result.
 * Debounce prevents IPC round-trips on every keystroke.
 */
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@shared/types/db'
import { Spinner } from '@renderer/components/ui/spinner'
import { cn } from '@renderer/lib/cn'

const DEBOUNCE_MS = 300

export interface CustomerAutocompleteProps {
  onSelect: (customer: Customer) => void
  /** Called when the user clears the selection */
  onClear?: () => void
  className?: string
}

export function CustomerAutocomplete({
  onSelect,
  onClear,
  className,
}: CustomerAutocompleteProps): React.JSX.Element {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await window.api.db.searchCustomers({ query })
        if (res.success) {
          setResults(res.data)
          setOpen(true)
        }
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return (): void => clearTimeout(timer)
  }, [query])

  // Close dropdown on outside click.
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return (): void => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const handleSelect = (customer: Customer): void => {
    setSelectedName(customer.name)
    setQuery('')
    setOpen(false)
    onSelect(customer)
  }

  const handleClear = (): void => {
    setSelectedName(null)
    setQuery('')
    setResults([])
    setOpen(false)
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {selectedName ? (
        <div className="flex items-center gap-2 rounded-kiosk border border-brand-400 bg-brand-50 px-3 py-2 text-sm text-surface-900">
          <span className="flex-1 truncate">{selectedName}</span>
          <button
            type="button"
            onClick={handleClear}
            aria-label={t('common.clear')}
            className="text-surface-500 hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-brand-400 outline-none rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="customer-autocomplete-list"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('checkInAutocomplete.searchPlaceholder')}
            className="w-full rounded-kiosk border border-surface-300 bg-surface-100 px-3 py-2 text-base text-surface-900 outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 pr-8"
          />
          {loading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              <Spinner size="sm" />
            </span>
          )}
        </div>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-kiosk border border-surface-300 bg-white py-2 shadow-lg">
          <p className="px-3 py-2 text-sm text-surface-500">{t('checkInAutocomplete.noResults')}</p>
        </div>
      )}

      {open && results.length > 0 && (
        <ul
          id="customer-autocomplete-list"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-kiosk border border-surface-300 bg-white shadow-lg max-h-56 overflow-y-auto"
        >
          {results.map((c) => (
            <li
              key={c.id}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(c)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(c)}
              tabIndex={0}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-brand-50 focus-visible:bg-brand-50 outline-none"
            >
              <span className="font-medium text-surface-900">{c.name}</span>
              {c.date_of_birth && (
                <span className="ml-2 text-xs text-surface-500">{c.date_of_birth}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
