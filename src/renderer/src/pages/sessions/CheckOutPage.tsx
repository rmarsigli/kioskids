import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { PreviewCheckoutResult, Session } from '@shared/types/db'
import { formatRs } from '@shared/utils/currency'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { checkOutRoute } from '../../router'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageStep = 'preview' | 'receipt'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Formats a duration in whole minutes as a compact "0h 00m" string. */
function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

/** Formats a UTC ISO-8601 string as a local time "HH:MM". */
function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Section: preview step (billing summary + actions)
// ---------------------------------------------------------------------------

interface PreviewSectionProps {
  preview: PreviewCheckoutResult
  onConfirm: () => void
  onCancel: () => void
  onBack: () => void
  confirming: boolean
  canceling: boolean
}

function PreviewSection({
  preview,
  onConfirm,
  onCancel,
  onBack,
  confirming,
  canceling,
}: PreviewSectionProps): React.JSX.Element {
  const busy = confirming || canceling

  return (
    <div className="flex flex-col gap-6">
      {/* Billing summary card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Sessao</CardTitle>
        </CardHeader>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-surface-500">Crianca</dt>
          <dd className="font-semibold text-surface-900">{preview.child_name}</dd>

          {preview.guardian_name && (
            <>
              <dt className="text-surface-500">Responsavel</dt>
              <dd className="font-semibold text-surface-900">{preview.guardian_name}</dd>
            </>
          )}

          <dt className="text-surface-500">Tarifa</dt>
          <dd className="font-semibold text-surface-900">{preview.tariff_name}</dd>

          <dt className="text-surface-500">Entrada</dt>
          <dd className="font-semibold text-surface-900">
            {formatLocalTime(preview.checked_in_at)}
          </dd>

          <dt className="text-surface-500">Duracao</dt>
          <dd className="font-semibold text-surface-900">{formatElapsed(preview.elapsed_minutes)}</dd>
        </dl>

        {/* Total prominence */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-sm font-medium text-surface-700">Total a cobrar</span>
          <span className="text-2xl font-extrabold text-brand-700">
            {formatRs(preview.preview_total)}
          </span>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full min-h-[3.5rem]"
          onClick={onConfirm}
          loading={confirming}
          disabled={busy}
          aria-label="Confirmar check-out e fechar sessao"
        >
          Confirmar Check-Out
        </Button>

        <Button
          variant="danger"
          size="lg"
          className="w-full min-h-[3.5rem]"
          onClick={onCancel}
          loading={canceling}
          disabled={busy}
          aria-label="Cancelar sessao sem cobrar"
        >
          Cancelar Sessao
        </Button>

        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={onBack}
          disabled={busy}
          aria-label="Voltar para a lista de sessoes"
        >
          Voltar
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: receipt offer step (shown after a successful checkout)
// ---------------------------------------------------------------------------

interface ReceiptSectionProps {
  session: Session
  onPrint: () => void
  onSkip: () => void
  printing: boolean
}

function ReceiptSection({
  session,
  onPrint,
  onSkip,
  printing,
}: ReceiptSectionProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Check-Out Realizado</CardTitle>
        </CardHeader>

        <p className="text-sm text-surface-600">
          Sessao de <strong>{session.child_name}</strong> encerrada com sucesso.
        </p>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-success-50 px-4 py-3">
          <span className="text-sm font-medium text-surface-700">Total cobrado</span>
          <span className="text-2xl font-extrabold text-success-700">
            {formatRs(session.total_cents ?? 0)}
          </span>
        </div>
      </Card>

      <p className="text-center text-sm text-surface-500">Deseja imprimir o recibo?</p>

      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full min-h-[3.5rem]"
          onClick={onPrint}
          loading={printing}
          disabled={printing}
          aria-label="Imprimir recibo"
        >
          Imprimir Recibo
        </Button>

        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={onSkip}
          disabled={printing}
          aria-label="Continuar sem imprimir"
        >
          Continuar sem imprimir
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CheckOutPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { id } = checkOutRoute.useParams()

  const [step, setStep] = useState<PageStep>('preview')
  const [loading, setLoading] = useState<boolean>(true)
  const [preview, setPreview] = useState<PreviewCheckoutResult | null>(null)
  const [closedSession, setClosedSession] = useState<Session | null>(null)
  const [confirming, setConfirming] = useState<boolean>(false)
  const [canceling, setCanceling] = useState<boolean>(false)
  const [printing, setPrinting] = useState<boolean>(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Load preview once on mount
  // -------------------------------------------------------------------------

  useEffect((): void => {
    void (async (): Promise<void> => {
      const result = await window.api.db.previewCheckout(id)
      if (result.success) {
        setPreview(result.data)
      } else {
        setPreviewError(result.error)
      }
      setLoading(false)
    })()
  }, [id])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleConfirm = useCallback(async (): Promise<void> => {
    setConfirming(true)
    try {
      const result = await window.api.db.checkOutSession({ id })
      if (result.success) {
        setClosedSession(result.data)
        setStep('receipt')
      } else {
        toast.error(`Erro no check-out: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Erro inesperado: ${String(err)}`)
    } finally {
      setConfirming(false)
    }
  }, [id])

  const handleCancel = useCallback(async (): Promise<void> => {
    setCanceling(true)
    try {
      const result = await window.api.db.cancelSession({
        id,
        notes: 'Cancelado pelo operador',
      })
      if (result.success) {
        toast.success('Sessao cancelada.')
        void navigate({ to: '/sessions' })
      } else {
        toast.error(`Erro ao cancelar: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Erro inesperado: ${String(err)}`)
    } finally {
      setCanceling(false)
    }
  }, [id, navigate])

  const handleBack = useCallback((): void => {
    void navigate({ to: '/sessions' })
  }, [navigate])

  const handlePrint = useCallback(async (): Promise<void> => {
    setPrinting(true)
    try {
      await window.api.hw.printReceipt()
      toast.success('Recibo enviado para impressao.')
    } catch {
      toast.error('Erro ao imprimir recibo.')
    } finally {
      setPrinting(false)
      void navigate({ to: '/sessions' })
    }
  }, [navigate])

  const handleSkipPrint = useCallback((): void => {
    void navigate({ to: '/sessions' })
  }, [navigate])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-surface-900">Check-Out</h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : previewError ? (
        <Card>
          <p className="text-sm text-danger-600">{previewError}</p>
          <Button variant="ghost" size="md" className="mt-4 w-full" onClick={handleBack}>
            Voltar
          </Button>
        </Card>
      ) : step === 'preview' && preview ? (
        <PreviewSection
          preview={preview}
          onConfirm={() => void handleConfirm()}
          onCancel={() => void handleCancel()}
          onBack={handleBack}
          confirming={confirming}
          canceling={canceling}
        />
      ) : step === 'receipt' && closedSession ? (
        <ReceiptSection
          session={closedSession}
          onPrint={() => void handlePrint()}
          onSkip={handleSkipPrint}
          printing={printing}
        />
      ) : null}
    </div>
  )
}
