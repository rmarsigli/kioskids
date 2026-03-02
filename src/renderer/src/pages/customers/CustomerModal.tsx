/**
 * CustomerModal — create or edit a customer with inline guardian/phone repeaters.
 *
 * The repeater works with local "draft" state to batch all writes into a single
 * save action. Only on submit do we call IPC for customer + guardian + phone upserts
 * / deletes, keeping the number of round-trips minimal.
 *
 * Deletions of guardians/phones that already exist in the DB are queued and
 * executed synchronously (SQLite cascade handles orphan phones automatically
 * when a guardian is deleted, so guardianPhone deletes are only needed for
 * existing phones removed from a guardian that itself is kept).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { randomUUID } from '@shared/utils/id'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { SaveCustomerSchema } from '@shared/utils/customer-schema'
import type { CustomerWithGuardians } from '@shared/types/db'
import { Button } from '../../../components/ui/Button'
import { Field, TextInput } from '../../../components/ui/FormField'
import { Dialog, DialogHeader } from '../../../components/ui/Dialog'
import { Spinner } from '../../../components/ui/Spinner'

// ---------------------------------------------------------------------------
// Draft data model (renderer-only, not persisted until Save)
// ---------------------------------------------------------------------------

interface DraftPhone {
  /** UUID — either the existing phone.id or a client-generated UUID for new entries. */
  draftId: string
  /** Non-null means this phone already exists in the DB. */
  existingId: string | null
  phone: string
  label: string
}

interface DraftGuardian {
  draftId: string
  existingId: string | null
  name: string
  phones: DraftPhone[]
  /** Existing phone IDs that were removed — need explicit delete IPC calls. */
  deletedPhoneIds: string[]
}

interface FormValues {
  name: string
  date_of_birth: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDraftsFromExisting(
  customer: CustomerWithGuardians,
): DraftGuardian[] {
  return customer.guardians.map((g) => ({
    draftId: g.id,
    existingId: g.id,
    name: g.name,
    deletedPhoneIds: [],
    phones: g.phones.map((p) => ({
      draftId: p.id,
      existingId: p.id,
      phone: p.phone,
      label: p.label ?? '',
    })),
  }))
}

function emptyGuardian(): DraftGuardian {
  return {
    draftId: randomUUID(),
    existingId: null,
    name: '',
    deletedPhoneIds: [],
    phones: [],
  }
}

function emptyPhone(): DraftPhone {
  return { draftId: randomUUID(), existingId: null, phone: '', label: '' }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CustomerModalProps {
  open: boolean
  /** Pass an existing customer to edit, or undefined/null to create. */
  customer: CustomerWithGuardians | null
  onClose: () => void
  onSaved: (customer: CustomerWithGuardians) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerModal({
  open,
  customer,
  onClose,
  onSaved,
}: CustomerModalProps): React.JSX.Element {
  const { t } = useTranslation()
  const [values, setValues] = useState<FormValues>({ name: '', date_of_birth: '', notes: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [guardians, setGuardians] = useState<DraftGuardian[]>([])
  const [deletedGuardianIds, setDeletedGuardianIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const customerId = useRef<string>(randomUUID())

  // Re-initialise state when the dialog opens or the target customer changes.
  useEffect(() => {
    if (!open) return
    if (customer) {
      customerId.current = customer.id
      setValues({
        name: customer.name,
        date_of_birth: customer.date_of_birth ?? '',
        notes: customer.notes ?? '',
      })
      setGuardians(buildDraftsFromExisting(customer))
    } else {
      customerId.current = randomUUID()
      setValues({ name: '', date_of_birth: '', notes: '' })
      setGuardians([])
    }
    setDeletedGuardianIds([])
    setErrors({})
  }, [open, customer])

  // ---------------------------------------------------------------------------
  // Field setters
  // ---------------------------------------------------------------------------

  const setField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }, [])

  const validateOnBlur = useCallback(
    (key: keyof FormValues) => {
      const result = SaveCustomerSchema.shape[key].safeParse(
        key === 'date_of_birth' || key === 'notes'
          ? values[key] || null
          : values[key],
      )
      setErrors((e) => ({
        ...e,
        [key]: result.success ? undefined : result.error.issues[0]?.message,
      }))
    },
    [values],
  )

  // ---------------------------------------------------------------------------
  // Guardian mutators
  // ---------------------------------------------------------------------------

  const addGuardian = (): void => {
    setGuardians((prev) => [...prev, emptyGuardian()])
  }

  const removeGuardian = (draftId: string): void => {
    setGuardians((prev) => {
      const g = prev.find((x) => x.draftId === draftId)
      if (g?.existingId) {
        setDeletedGuardianIds((ids) => [...ids, g.existingId!])
      }
      return prev.filter((x) => x.draftId !== draftId)
    })
  }

  const updateGuardianName = (draftId: string, name: string): void => {
    setGuardians((prev) =>
      prev.map((g) => (g.draftId === draftId ? { ...g, name } : g)),
    )
  }

  // ---------------------------------------------------------------------------
  // Phone mutators
  // ---------------------------------------------------------------------------

  const addPhone = (guardianDraftId: string): void => {
    setGuardians((prev) =>
      prev.map((g) =>
        g.draftId === guardianDraftId
          ? { ...g, phones: [...g.phones, emptyPhone()] }
          : g,
      ),
    )
  }

  const removePhone = (guardianDraftId: string, phoneDraftId: string): void => {
    setGuardians((prev) =>
      prev.map((g) => {
        if (g.draftId !== guardianDraftId) return g
        const phone = g.phones.find((p) => p.draftId === phoneDraftId)
        const deletedPhoneIds = phone?.existingId
          ? [...g.deletedPhoneIds, phone.existingId]
          : g.deletedPhoneIds
        return {
          ...g,
          deletedPhoneIds,
          phones: g.phones.filter((p) => p.draftId !== phoneDraftId),
        }
      }),
    )
  }

  const updatePhoneField = (
    guardianDraftId: string,
    phoneDraftId: string,
    key: keyof Pick<DraftPhone, 'phone' | 'label'>,
    value: string,
  ): void => {
    setGuardians((prev) =>
      prev.map((g) =>
        g.draftId === guardianDraftId
          ? {
              ...g,
              phones: g.phones.map((p) =>
                p.draftId === phoneDraftId ? { ...p, [key]: value } : p,
              ),
            }
          : g,
      ),
    )
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    const customerParsed = SaveCustomerSchema.safeParse({
      id: customerId.current,
      name: values.name,
      date_of_birth: values.date_of_birth || null,
      notes: values.notes || null,
    })

    if (!customerParsed.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of customerParsed.error.issues) {
        const key = issue.path[0] as keyof FormValues
        if (key) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      // 1 — Save customer
      const custResult = await window.api.db.saveCustomer(customerParsed.data)
      if (!custResult.success) {
        toast.error(t('customers.errorSave', { error: custResult.error }))
        return
      }

      // 2 — Delete removed guardians (cascade handles their phones)
      for (const gid of deletedGuardianIds) {
        const res = await window.api.db.deleteGuardian(gid)
        if (!res.success) {
          toast.error(t('customers.errorDeleteGuardian', { error: res.error }))
        }
      }

      // 3 — Save guardians
      for (const g of guardians) {
        if (!g.name.trim()) continue

        // Delete removed phones for this guardian (only when guardian already exists)
        for (const pid of g.deletedPhoneIds) {
          const res = await window.api.db.deleteGuardianPhone(pid)
          if (!res.success) {
            toast.error(t('customers.errorDeletePhone', { error: res.error }))
          }
        }

        const gRes = await window.api.db.saveGuardian({
          id: g.existingId ?? g.draftId,
          customer_id: customerId.current,
          name: g.name,
        })
        if (!gRes.success) {
          toast.error(t('customers.errorSaveGuardian', { error: gRes.error }))
          continue
        }

        // Save new phones for this guardian
        for (const p of g.phones) {
          if (!p.phone.trim()) continue
          if (p.existingId) continue // existing phone — no update needed (immutable)

          const pRes = await window.api.db.saveGuardianPhone({
            id: p.draftId,
            guardian_id: gRes.data.id,
            phone: p.phone,
            label: p.label || null,
          })
          if (!pRes.success) {
            toast.error(t('customers.errorSavePhone', { error: pRes.error }))
          }
        }
      }

      // 4 — Reload the full customer record to return a consistent shape
      const fullResult = await window.api.db.getCustomer(customerId.current)
      if (fullResult.success) {
        toast.success(customer ? t('customers.successUpdate') : t('customers.successCreate'))
        onSaved(fullResult.data)
      }
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      ariaLabel={customer ? t('customers.modalTitleEdit') : t('customers.modalTitleCreate')}
    >
      <DialogHeader
        title={customer ? t('customers.modalTitleEdit') : t('customers.modalTitleCreate')}
        onClose={onClose}
      />

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        {/* Customer fields */}
        <Field id="cust-name" label={t('customers.fieldName')} required error={errors.name}>
          <TextInput
            id="cust-name"
            value={values.name}
            onChange={(v) => setField('name', v)}
            onBlur={() => validateOnBlur('name')}
            placeholder={t('customers.fieldNamePlaceholder')}
            error={errors.name}
            autoFocus
          />
        </Field>

        <Field id="cust-dob" label={t('customers.fieldDateOfBirth')} error={errors.date_of_birth}>
          <TextInput
            id="cust-dob"
            value={values.date_of_birth}
            onChange={(v) => setField('date_of_birth', v)}
            onBlur={() => validateOnBlur('date_of_birth')}
            placeholder={t('customers.fieldDateOfBirthPlaceholder')}
            error={errors.date_of_birth}
          />
        </Field>

        <Field id="cust-notes" label={t('customers.fieldNotes')} error={errors.notes}>
          <textarea
            id="cust-notes"
            value={values.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder={t('customers.fieldNotesPlaceholder')}
            rows={2}
            className="w-full rounded-kiosk border border-surface-300 bg-surface-100 px-3 py-2 text-base text-surface-900 outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 resize-none"
          />
        </Field>

        {/* Guardians repeater */}
        <section aria-label={t('customers.guardiansSectionTitle')}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-700">
              {t('customers.guardiansSectionTitle')}
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addGuardian}>
              {t('customers.addGuardianButton')}
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {guardians.map((g, gi) => (
              <div
                key={g.draftId}
                className="rounded-kiosk border border-surface-300 bg-surface-100 p-4 flex flex-col gap-3"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field
                      id={`guardian-name-${g.draftId}`}
                      label={`${t('customers.guardianNameLabel')} ${gi + 1}`}
                    >
                      <TextInput
                        id={`guardian-name-${g.draftId}`}
                        value={g.name}
                        onChange={(v) => updateGuardianName(g.draftId, v)}
                        placeholder={t('customers.guardianNamePlaceholder')}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    aria-label={t('customers.removeGuardian')}
                    onClick={() => removeGuardian(g.draftId)}
                    className="mb-0.5 rounded p-1.5 text-danger-500 hover:bg-danger-50 focus-visible:ring-2 focus-visible:ring-danger-400 outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Phones repeater */}
                <div className="pl-2 border-l-2 border-surface-300">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-surface-600">
                      {t('customers.phonesSectionTitle')}
                    </span>
                    <button
                      type="button"
                      onClick={() => addPhone(g.draftId)}
                      className="text-xs text-brand-600 hover:underline focus-visible:ring-2 focus-visible:ring-brand-400 outline-none rounded"
                    >
                      {t('customers.addPhoneButton')}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {g.phones.map((p) => (
                      <div key={p.draftId} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={p.phone}
                          onChange={(e) => updatePhoneField(g.draftId, p.draftId, 'phone', e.target.value)}
                          placeholder={t('customers.phonePlaceholder')}
                          aria-label={t('customers.phoneLabel')}
                          className="flex-1 rounded border border-surface-300 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <input
                          type="text"
                          value={p.label}
                          onChange={(e) => updatePhoneField(g.draftId, p.draftId, 'label', e.target.value)}
                          placeholder={t('customers.phoneLabelPlaceholder')}
                          aria-label={t('customers.phoneLabelField')}
                          className="w-28 rounded border border-surface-300 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <button
                          type="button"
                          aria-label={t('customers.removePhone')}
                          onClick={() => removePhone(g.draftId, p.draftId)}
                          className="text-danger-500 hover:text-danger-700 focus-visible:ring-2 focus-visible:ring-danger-400 outline-none rounded p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-surface-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('customers.cancelButton')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : t('customers.saveButton')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
