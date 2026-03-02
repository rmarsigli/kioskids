import React from 'react'
import { cn } from '@renderer/lib/cn'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

export function Spinner({
  size = 'md',
  label = 'Carregando…',
  className = '',
}: SpinnerProps): React.JSX.Element {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block animate-spin rounded-full border-brand-400 border-t-transparent', sizeClasses[size], className)}
    />
  )
}

export function SpinnerOverlay({ label = 'Carregando…' }: { label?: string }): React.JSX.Element {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-surface-700">
      <Spinner size="lg" label={label} />
      <span className="text-sm">{label}</span>
    </div>
  )
}
