import React from 'react'
import { cn } from '@renderer/lib/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  /** Render as a different HTML element */
  as?: 'div' | 'article' | 'section'
  /** Adds interactive hover/active styles */
  interactive?: boolean
}

export function Card({
  children,
  className = '',
  as: Tag = 'div',
  interactive = false,
}: CardProps): React.JSX.Element {
  return (
    <Tag
      className={cn(
        'rounded-kiosk border border-surface-300 bg-surface-100 p-4',
        interactive &&
          'cursor-pointer transition-colors hover:border-brand-400 hover:bg-surface-200 active:bg-surface-300',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps): React.JSX.Element {
  return <div className={cn('mb-3 flex items-center justify-between', className)}>{children}</div>
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps): React.JSX.Element {
  return <h3 className={cn('text-base font-semibold text-surface-900', className)}>{children}</h3>
}
