import React from 'react'
import type { Tariff } from '@shared/types/db'
import { formatRs } from '@shared/utils/currency'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export interface TariffCardProps {
  tariff: Tariff
  onEdit: (tariff: Tariff) => void
  onDeactivate: (id: number) => void
  deactivating?: boolean
}

export function TariffCard({
  tariff,
  onEdit,
  onDeactivate,
  deactivating = false,
}: TariffCardProps): React.JSX.Element {
  const isActive = tariff.is_active === 1

  return (
    <Card as="article" className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-surface-900">{tariff.name}</h2>
          <Badge status={isActive ? 'active' : 'canceled'} />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(tariff)}>
            Editar
          </Button>
          {isActive && (
            <Button
              size="sm"
              variant="danger"
              loading={deactivating}
              onClick={() => onDeactivate(tariff.id)}
            >
              Desativar
            </Button>
          )}
        </div>
      </div>

      {/* Pricing details */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <TariffDetail
          label="Preco base"
          value={`${formatRs(tariff.base_price)} / ${tariff.base_minutes} min`}
        />
        <TariffDetail
          label="Fracao adicional"
          value={`${formatRs(tariff.additional_fraction_price)} / ${tariff.additional_fraction_minutes} min`}
        />
        <TariffDetail
          label="Tolerancia"
          value={tariff.tolerance_minutes > 0 ? `${tariff.tolerance_minutes} min` : 'Sem tolerancia'}
        />
      </dl>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Local helper — reduces repetition in the detail grid
// ---------------------------------------------------------------------------

function TariffDetail({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-surface-500">{label}</dt>
      <dd className="text-surface-800">{value}</dd>
    </div>
  )
}
