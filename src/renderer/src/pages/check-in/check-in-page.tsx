/**
 * CheckInForm — form-only component for starting a new session.
 *
 * Does NOT carry any page wrapper, title, or Card — intended to be used
 * inside a Dialog (CheckInModal via AppLayout) or any other host container.
 */
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation, Trans } from 'react-i18next'
import { CheckInRequestSchema } from '@shared/utils/check-in-schema'
import type { Customer, Tariff } from '@shared/types/db'
import { Button } from '@renderer/components/ui/button'
import { Field, TextInput } from '@renderer/components/ui/form-field'
import { Spinner } from '@renderer/components/ui/spinner'
import { CustomerAutocomplete } from '@renderer/components/customer-autocomplete'
import { cn } from '@renderer/lib/cn'

// ---------------------------------------------------------------------------
// Form value types — all inputs are strings so HTML inputs remain controlled
// ---------------------------------------------------------------------------

interface FormValues {
  child_name: string
  guardian_name: string
  guardian_contact: string
  tariff_id: string   // numeric id stored as string for the <select>
  customer_id: string // UUID of linked customer, or empty string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const INITIAL_VALUES: FormValues = {
  child_name: '',
  guardian_name: '',
  guardian_contact: '',
  tariff_id: '',
  customer_id: '',
}

// 2-second debounce window to prevent accidental double-submit.
const SUBMIT_DEBOUNCE_MS = 2_000

// ---------------------------------------------------------------------------
// Blur validation helper
// ---------------------------------------------------------------------------

function validateField(name: keyof FormValues, values: FormValues): string | undefined {
  if (name === 'guardian_contact' || name === 'customer_id') return undefined

  const fieldChecks: Partial<Record<keyof FormValues, () => { success: boolean; error?: { issues: Array<{ message: string }> } }>> = {
    child_name: () => CheckInRequestSchema.shape.child_name.safeParse(values.child_name),
    guardian_name: () => CheckInRequestSchema.shape.guardian_name.safeParse(values.guardian_name),
    tariff_id: () => CheckInRequestSchema.shape.tariff_id.safeParse(Number(values.tariff_id) || 0),
  }

  const result = fieldChecks[name]?.()
  if (result && !result.success) return result.error?.issues[0]?.message
  return undefined
}

// ---------------------------------------------------------------------------
// Local micro-component — TariffSelect
// (Field + TextInput are imported from @/components/ui/FormField)
// ---------------------------------------------------------------------------

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
  const { t } = useTranslation()

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
      <option value="">{t('checkIn.fieldTariffPlaceholder')}</option>
      {tariffs.map((t) => (
        <option key={t.id} value={String(t.id)}>
          {t.name}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// CheckInForm — public component
// ---------------------------------------------------------------------------

export interface CheckInFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function CheckInForm({ onSuccess, onCancel }: CheckInFormProps): React.JSX.Element {
  const { t } = useTranslation()

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
          toast.error(t('checkIn.errorLoadTariffs'))
        }
      })
      .catch(() => toast.error(t('checkIn.errorLoadTariffsGeneric')))
      .finally(() => setLoadingTariffs(false))
  }, [t])

  // ---------------------------------------------------------------------------
  // Customer autocomplete — pre-fill fields when a known customer is selected
  // ---------------------------------------------------------------------------

  const handleCustomerSelect = async (customer: Customer): Promise<void> => {
    // Fetch full record to get guardians for pre-fill.
    const res = await window.api.db.getCustomer(customer.id)
    const guardian = res.success ? res.data.guardians[0] : undefined
    const phone = guardian?.phones[0]?.phone ?? ''
    setValues((prev) => ({
      ...prev,
      child_name: customer.name,
      guardian_name: guardian?.name ?? prev.guardian_name,
      guardian_contact: phone || prev.guardian_contact,
      customer_id: customer.id,
    }))
    setErrors({})
  }

  const handleCustomerClear = (): void => {
    setValues((prev) => ({ ...prev, customer_id: '' }))
  }

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
      customer_id: values.customer_id || undefined,
    }

    // Full pre-submit Zod validation.
    const parsed = CheckInRequestSchema.safeParse(dto)
    if (!parsed.success) {
      const newErrors: FormErrors = {}
      for (const issue of parsed.error.issues) {
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
        toast.success(t('checkIn.successCheckIn'))
        setValues(INITIAL_VALUES)
        setErrors({})
        onSuccess()
      } else if (res.code === 'TARIFF_INACTIVE') {
        setErrors({ tariff_id: t('checkIn.errorTariffInactive') })
      } else {
        toast.error(res.error ?? t('checkIn.errorCheckIn'))
      }
    } catch {
      toast.error(t('checkIn.errorUnexpected'))
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loadingTariffs) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Optional: search an existing client to pre-fill fields */}
      <Field id="customer-search" label={t('checkInAutocomplete.searchLabel')}>
        <CustomerAutocomplete
          onSelect={(c) => void handleCustomerSelect(c)}
          onClear={handleCustomerClear}
        />
      </Field>

      <Field id="child_name" label={t('checkIn.fieldChildName')} required error={errors.child_name}>
        <TextInput
          id="child_name"
          value={values.child_name}
          onChange={(v) => handleChange('child_name', v)}
          onBlur={() => handleBlur('child_name')}
          placeholder={t('checkIn.fieldChildNamePlaceholder')}
          error={errors.child_name}
          autoFocus
        />
      </Field>

      <Field id="guardian_name" label={t('checkIn.fieldGuardianName')} required error={errors.guardian_name}>
        <TextInput
          id="guardian_name"
          value={values.guardian_name}
          onChange={(v) => handleChange('guardian_name', v)}
          onBlur={() => handleBlur('guardian_name')}
          placeholder={t('checkIn.fieldGuardianNamePlaceholder')}
          error={errors.guardian_name}
        />
      </Field>

      <Field id="guardian_contact" label={t('checkIn.fieldGuardianContact')} error={errors.guardian_contact}>
        <TextInput
          id="guardian_contact"
          value={values.guardian_contact}
          onChange={(v) => handleChange('guardian_contact', v)}
          placeholder={t('checkIn.fieldGuardianContactPlaceholder')}
          error={errors.guardian_contact}
        />
      </Field>

      <Field id="tariff_id" label={t('checkIn.fieldTariff')} required error={errors.tariff_id}>
        {tariffs.length === 0 ? (
          <p className="text-sm text-warning-600">
            <Trans
              i18nKey="checkIn.noActiveTariffMessage"
              components={{
                link: (
                  <button
                    type="button"
                    className="underline"
                    onClick={onCancel}
                  />
                ),
              }}
            />
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

      <div className="mt-2 flex justify-end gap-3 border-t border-surface-200 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={submitting}
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={submitting || tariffs.length === 0}
          loading={submitting}
        >
          {t('checkIn.submitButton')}
        </Button>
      </div>
    </form>
  )
}
