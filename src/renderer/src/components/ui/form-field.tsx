/**
 * Shared form primitive components used across all kiosk forms.
 *
 * Field    — label + children + optional error paragraph (with role="alert")
 * TextInput — styled controlled text input with error-state border
 */
import React from 'react'
import { cn } from '@renderer/lib/cn'

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

export interface FieldProps {
  /** The `id` of the form control this label targets (maps to htmlFor). */
  id: string
  label: string
  /** When true, renders a red asterisk after the label text. */
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function Field({ id, label, required, error, children }: FieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-surface-700">
        {label}
        {required && (
          <span className="ml-1 text-danger-500" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TextInput
// ---------------------------------------------------------------------------

export interface TextInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
  autoFocus?: boolean
}

export function TextInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  autoFocus,
}: TextInputProps): React.JSX.Element {
  return (
    <input
      id={id}
      type="text"
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        'w-full rounded-kiosk border bg-surface-100 px-3 py-2 text-base text-surface-900',
        'outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1',
        error ? 'border-danger-500' : 'border-surface-300',
      )}
    />
  )
}
