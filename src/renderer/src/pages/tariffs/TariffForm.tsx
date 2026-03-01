import React, { useState } from 'react'
import { toast } from 'sonner'
import { SaveTariffSchema } from '@shared/utils/tariff-schema'
import { rsToCents, centsToRs } from '@shared/utils/currency'
import type { Tariff, SaveTariffDto } from '@shared/types/db'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { cn } from '../../lib/cn'

// ---------------------------------------------------------------------------
// Form value types — all inputs are strings so HTML inputs stay controlled
// ---------------------------------------------------------------------------

interface FormValues {
  name: string
  base_price: string
  base_minutes: string
  additional_fraction_price: string
  additional_fraction_minutes: string
  tolerance_minutes: string
  is_active: boolean
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const INITIAL_VALUES: FormValues = {
  name: '',
  base_price: '0,00',
  base_minutes: '60',
  additional_fraction_price: '0,00',
  additional_fraction_minutes: '15',
  tolerance_minutes: '5',
  is_active: true,
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function toDto(values: FormValues, id?: number): SaveTariffDto {
  return {
    id,
    name: values.name,
    base_price: rsToCents(values.base_price),
    base_minutes: parseInt(values.base_minutes, 10) || 0,
    additional_fraction_price: rsToCents(values.additional_fraction_price),
    additional_fraction_minutes: parseInt(values.additional_fraction_minutes, 10) || 0,
    tolerance_minutes: parseInt(values.tolerance_minutes, 10) || 0,
    is_active: values.is_active ? 1 : 0,
  }
}

function fromTariff(tariff: Tariff): FormValues {
  return {
    name: tariff.name,
    base_price: centsToRs(tariff.base_price),
    base_minutes: String(tariff.base_minutes),
    additional_fraction_price: centsToRs(tariff.additional_fraction_price),
    additional_fraction_minutes: String(tariff.additional_fraction_minutes),
    tolerance_minutes: String(tariff.tolerance_minutes),
    is_active: tariff.is_active === 1,
  }
}

// ---------------------------------------------------------------------------
// Micro-components — CurrencyInput, NumberInput, Field
// ---------------------------------------------------------------------------

interface CurrencyInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}

function CurrencyInput({
  id,
  value,
  onChange,
  onBlur,
  error,
}: CurrencyInputProps): React.JSX.Element {
  const [focused, setFocused] = useState(false)

  const handleBlur = (): void => {
    setFocused(false)
    onChange(centsToRs(rsToCents(value)))
    onBlur?.()
  }

  return (
    <div className="relative">
      {!focused && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-surface-500">
          R$
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        className={cn(
          'w-full rounded-kiosk border bg-surface-100 py-2 pr-3 text-base text-surface-900',
          'outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1',
          focused ? 'pl-3' : 'pl-9',
          error ? 'border-danger-500' : 'border-surface-300',
        )}
      />
    </div>
  )
}

interface NumberInputProps {
  id: string
  value: string
  min?: number
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}

function NumberInput({
  id,
  value,
  min = 0,
  onChange,
  onBlur,
  error,
}: NumberInputProps): React.JSX.Element {
  return (
    <input
      id={id}
      type="number"
      min={min}
      value={value}
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

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}

function Field({ label, htmlFor, error, children }: FieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-surface-700">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TariffForm — public component
// ---------------------------------------------------------------------------

export interface TariffFormProps {
  /** When provided, the form pre-fills and sends an update instead of insert. */
  tariff?: Tariff
  onSuccess: (saved: Tariff) => void
  onCancel: () => void
}

export function TariffForm({ tariff, onSuccess, onCancel }: TariffFormProps): React.JSX.Element {
  const [values, setValues] = useState<FormValues>(tariff ? fromTariff(tariff) : INITIAL_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const set =
    (field: keyof FormValues) =>
    (value: string | boolean): void =>
      setValues((prev) => ({ ...prev, [field]: value }))

  const validateField = (field: keyof FormValues): void => {
    const result = SaveTariffSchema.safeParse(toDto(values, tariff?.id))
    setErrors((prev) => ({
      ...prev,
      [field]: result.success
        ? undefined
        : (result.error.flatten().fieldErrors[
            field as keyof typeof result.error.flatten.fieldErrors
          ] as string[] | undefined)?.[0],
    }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const dto = toDto(values, tariff?.id)
    const parsed = SaveTariffSchema.safeParse(dto)

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      setErrors(
        Object.fromEntries(
          Object.entries(fe).map(([k, msgs]) => [k, (msgs as string[])[0]]),
        ) as FormErrors,
      )
      return
    }

    setSubmitting(true)
    try {
      const result = await window.api.db.saveTariff(parsed.data as SaveTariffDto)
      if (result.success) {
        toast.success(tariff ? 'Tarifa atualizada.' : 'Tarifa criada.')
        onSuccess(result.data)
      } else {
        toast.error(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{tariff ? 'Editar Tarifa' : 'Nova Tarifa'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pt-2">
        <Field label="Nome" htmlFor="tf-name" error={errors.name}>
          <input
            id="tf-name"
            type="text"
            value={values.name}
            onChange={(e) => set('name')(e.target.value)}
            onBlur={() => validateField('name')}
            className={cn(
              'w-full rounded-kiosk border bg-surface-100 px-3 py-2 text-base text-surface-900',
              'outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1',
              errors.name ? 'border-danger-500' : 'border-surface-300',
            )}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Preco base" htmlFor="tf-base-price" error={errors.base_price}>
            <CurrencyInput
              id="tf-base-price"
              value={values.base_price}
              onChange={set('base_price') as (v: string) => void}
              onBlur={() => validateField('base_price')}
              error={errors.base_price}
            />
          </Field>

          <Field
            label="Minutos inclusos"
            htmlFor="tf-base-minutes"
            error={errors.base_minutes}
          >
            <NumberInput
              id="tf-base-minutes"
              min={1}
              value={values.base_minutes}
              onChange={set('base_minutes') as (v: string) => void}
              onBlur={() => validateField('base_minutes')}
              error={errors.base_minutes}
            />
          </Field>

          <Field
            label="Preco por fracao adicional"
            htmlFor="tf-frac-price"
            error={errors.additional_fraction_price}
          >
            <CurrencyInput
              id="tf-frac-price"
              value={values.additional_fraction_price}
              onChange={set('additional_fraction_price') as (v: string) => void}
              onBlur={() => validateField('additional_fraction_price')}
              error={errors.additional_fraction_price}
            />
          </Field>

          <Field
            label="Minutos por fracao"
            htmlFor="tf-frac-minutes"
            error={errors.additional_fraction_minutes}
          >
            <NumberInput
              id="tf-frac-minutes"
              min={1}
              value={values.additional_fraction_minutes}
              onChange={set('additional_fraction_minutes') as (v: string) => void}
              onBlur={() => validateField('additional_fraction_minutes')}
              error={errors.additional_fraction_minutes}
            />
          </Field>

          <Field
            label="Tolerancia (minutos)"
            htmlFor="tf-tolerance"
            error={errors.tolerance_minutes}
          >
            <NumberInput
              id="tf-tolerance"
              min={0}
              value={values.tolerance_minutes}
              onChange={set('tolerance_minutes') as (v: string) => void}
              onBlur={() => validateField('tolerance_minutes')}
              error={errors.tolerance_minutes}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={values.is_active}
            onChange={(e) => set('is_active')(e.target.checked)}
            className="h-5 w-5 accent-brand-500"
          />
          <span className="text-sm font-medium text-surface-800">Tarifa ativa</span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Card>
  )
}
