import React from 'react'

export type BadgeStatus = 'active' | 'completed' | 'canceled'

interface BadgeProps {
  status: BadgeStatus
  className?: string
}

const statusConfig: Record<BadgeStatus, { label: string; classes: string }> = {
  active: {
    label: 'Ativo',
    classes: 'bg-success-600/20 text-success-400 border border-success-600/30',
  },
  completed: {
    label: 'Concluído',
    classes: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
  },
  canceled: {
    label: 'Cancelado',
    classes: 'bg-surface-300/30 text-surface-700 border border-surface-400/30',
  },
}

export function Badge({ status, className = '' }: BadgeProps): React.JSX.Element {
  const { label, classes } = statusConfig[status]

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        classes,
        className,
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'h-1.5 w-1.5 rounded-full',
          status === 'active' && 'bg-success-400',
          status === 'completed' && 'bg-brand-400',
          status === 'canceled' && 'bg-surface-600',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {label}
    </span>
  )
}
