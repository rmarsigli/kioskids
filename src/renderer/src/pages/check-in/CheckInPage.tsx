import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { CheckInRequestSchema } from '@shared/utils/check-in-schema'
import type { Tariff } from '@shared/types/db'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { cn } from '../../lib/cn'

// ---------------------------------------------------------------------------
// Form value types — all inputs are strings so HTML inputs remain controlled
// ---------------------------------------------------------------------------

interface FormValues {
  child_name: string
  guardian_name: string
  guardian_contact: string
  tariff_id: string   // numeric id stored as string for the <select>
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const INITIAL_VALUES: FormValues = {
  child_name: '',
  guardian_name: '',
  guardian_contact: '',
  tariff_id: '',
}

// 2-second debounce window to prevent accidental double-submit.
const SUBMIT_DEBOUNCE_MS = 2_000

// ---------------------------------------------------------------------------
// Blur validation helper
// ---------------------------------------------------------------------------

/**
 * Validates a single field against its individual schema shape.
 * Returns the first error message, or undefined when the field is valid.
 * guardian_contact is optional — it never produces a blur error.
 */
function validateField(name: keyof FormValues, values: FormValues): string | undefined {
  if (name === 'guardian_contact') return undefined

  type SafeParseResult = { success: boolean; error?: { errors: Array<{ message: string }> } }
  const fieldChecks: Partial<Record<keyof FormValues, () => SafeParseResult>> = {
    child_name: () => CheckInRequestSchema.shape.child_name.safeParse(values.child_name),
    guardian_name: () => CheckInRequestSchema.shape.guardian_name.safeParse(values.guardian_name),
    tariff_id: () => CheckInRequestSchema.shape.tariff_id.safeParse(Number(values.tariff_id) || 0),
  }

  const result = fieldChecks[name]?.()
  if (result && !result.success) return result.error?.errors[0]?.message
  return undefined
}

// ---------------------------------------------------------------------------
// Micro-components
// ---------------------------------------------------------------------------

interface FieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

function Field({ id, label, required, error, children }: FieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-surface-800">
        {label}
        {required && <span className="ml-1 text-danger-500" aria-hidden>*</span>}
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

interface TextInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
  autoFocus?: boolean
}

function TextInput({
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

interface TariffSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  tariffs: Tariff[]
  error?: string
}

function TariffSelect({
  id,
  value,
  onChange,
  onBlur,
  tariffs,
  error,
}: TariffSelectProps): React.JSX.Element {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        'w-full rounded-kiosk border bg-surface-100 px-3 py-2 text-base text-surface-900',
        'outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1',
        error ? 'border-danger-500' : 'border-surface-300',
      )}
    >
      <option value="">Selecione uma tarifa...</option>
      {tariffs.map((t) => (
        <option key={t.id} value={String(t.id)}>
          {t.name}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// CheckInPage
// ---------------------------------------------------------------------------

export function CheckInPage(): React.JSX.Element {
  const navigate = useNavigate()

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [loadingTariffs, setLoadingTariffs] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Ref-gated debounce: prevents double-submit within SUBMIT_DEBOUNCE_MS.
  const submitLock = useRef(false)

  // Load active tariffs once on mount.
  useEffect(() => {
    window.api.db
      .getTariffs()
      .then((res) => {
        if (res.success) {
          setTariffs(res.data)
        } else {
          toast.error('Nao foi possivel carregar as tarifas.')
        }
      })
      .catch(() => toast.error('Erro ao carregar tarifas.'))
      .finally(() => setLoadingTariffs(false))
  }, [])

  // ---------------------------------------------------------------------------
  // Change / blur handlers
  // ---------------------------------------------------------------------------

  function handleChange(name: keyof FormValues, value: string): void {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear the field error as soon as the user starts typing again.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleBlur(name: keyof FormValues): void {
    setErrors((prev) => ({ ...prev, [name]: validateField(name, values) }))
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (submitLock.current || submitting) return

    // Acquire debounce lock; release after SUBMIT_DEBOUNCE_MS regardless of outcome.
    submitLock.current = true
    setTimeout(() => { submitLock.current = false }, SUBMIT_DEBOUNCE_MS)

    const dto = {
      child_name: values.child_name,
      guardian_name: values.guardian_name,
      guardian_contact: values.guardian_contact || undefined,
      tariff_id: Number(values.tariff_id),
    }

    // Full pre-submit Zod validation.
    const parsed = CheckInRequestSchema.safeParse(dto)
    if (!parsed.success) {
      const newErrors: FormErrors = {}
      for (const issue of parsed.error.errors) {
        const field = issue.path[0] as keyof FormValues
        if (field && !newErrors[field]) newErrors[field] = issue.message
      }
      setErrors(newErrors)
      submitLock.current = false
      return
    }

    setSubmitting(true)
    try {
      const res = await window.api.db.checkIn(parsed.data)
      if (res.success) {
        toast.success('Check-in realizado com sucesso!')
        setValues(INITIAL_VALUES)
        setErrors({})
        navigate({ to: '/sessions' })
      } else if (res.code === 'TARIFF_INACTIVE') {
        setErrors({ tariff_id: 'A tarifa selecionada nao esta mais ativa.' })
      } else {
        toast.error(res.error ?? 'Erro ao realizar check-in.')
      }
    } catch {
      toast.error('Erro inesperado ao realizar check-in.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-surface-900">Check-in</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Nova Sessao</CardTitle>
        </CardHeader>

        {loadingTariffs ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
            <Field id="child_name" label="Nome da crianca" required error={errors.child_name}>
              <TextInput
                id="child_name"
                value={values.child_name}
                onChange={(v) => handleChange('child_name', v)}
                onBlur={() => handleBlur('child_name')}
                placeholder="Ex.: Maria"
                error={errors.child_name}
                autoFocus
              />
            </Field>

            <Field
              id="guardian_name"
              label="Nome do responsavel"
              required
              error={errors.guardian_name}
            >
              <TextInput
                id="guardian_name"
                value={values.guardian_name}
                onChange={(v) => handleChange('guardian_name', v)}
                onBlur={() => handleBlur('guardian_name')}
                placeholder="Ex.: Joao Silva"
                error={errors.guardian_name}
              />
            </Field>

            <Field
              id="guardian_contact"
              label="Contato (WhatsApp / telefone)"
              error={errors.guardian_contact}
            >
              <TextInput
                id="guardian_contact"
                value={values.guardian_contact}
                onChange={(v) => handleChange('guardian_contact', v)}
                placeholder="Ex.: (11) 9 1234-5678"
                error={errors.guardian_contact}
              />
            </Field>

            <Field id="tariff_id" label="Tarifa" required error={errors.tariff_id}>
              {tariffs.length === 0 ? (
                <p className="text-sm text-warning-600">
                  Nenhuma tarifa ativa. Cadastre uma em{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => navigate({ to: '/tariffs' })}
                  >
                    Tarifas
                  </button>
                  .
                </p>
              ) : (
                <TariffSelect
                  id="tariff_id"
                  value={values.tariff_id}
                  onChange={(v) => handleChange('tariff_id', v)}
                  onBlur={() => handleBlur('tariff_id')}
                  tariffs={tariffs}
                  error={errors.tariff_id}
                />
              )}
            </Field>

            <div className="mt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => { setValues(INITIAL_VALUES); setErrors({}) }}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                disabled={submitting || tariffs.length === 0}
                loading={submitting}
              >
                Iniciar Sessao
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
