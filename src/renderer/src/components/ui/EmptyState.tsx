import React from 'react'
import { cn } from '../../lib/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4 px-6 py-16 text-center', className)}
    >
      {icon && (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-200 text-surface-600">
          {icon}
        </span>
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold text-surface-800">{title}</p>
        {description && <p className="text-sm text-surface-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
