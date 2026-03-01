import React from 'react'
import { cn } from '../../lib/cn'

export type BadgeStatus = 'active' | 'completed' | 'canceled'

interface BadgeProps {
  status: BadgeStatus
  className?: string
}

// Single source of truth for all status-derived styles — DRY: no status switch elsewhere
const statusConfig: Record<BadgeStatus, { label: string; classes: string; dotClass: string }> = {
  active: {
    label: 'Ativo',
    classes: 'bg-success-600/20 text-success-400 border border-success-600/30',
    dotClass: 'bg-success-400',
  },
  completed: {
    label: 'Concluído',
    classes: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
    dotClass: 'bg-brand-400',
  },
  canceled: {
    label: 'Cancelado',
    classes: 'bg-surface-300/30 text-surface-700 border border-surface-400/30',
    dotClass: 'bg-surface-600',
  },
}

export function Badge({ status, className }: BadgeProps): React.JSX.Element {
  const { label, classes, dotClass } = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        classes,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      {label}
    </span>
  )
}
