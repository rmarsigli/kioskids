/**
 * Accessible modal dialog using the native HTML <dialog> element.
 * Closes on Escape (native behaviour) or when the backdrop is clicked.
 * Uses a ref callback to open/close imperatively so no external portals are needed.
 */
import React, { useEffect, useRef } from 'react'
import { cn } from '@renderer/lib/cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  /** ARIA label for the dialog — required when there is no visible heading. */
  ariaLabel?: string
  /** Dialog width variant. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const SIZE_CLASSES: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-lg',
  lg: 'w-full max-w-2xl',
}

export function Dialog({
  open,
  onClose,
  ariaLabel,
  size = 'md',
  children,
}: DialogProps): React.JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  // Sync close events triggered by native Escape key.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handleClose = (): void => onClose()
    el.addEventListener('close', handleClose)
    return (): void => el.removeEventListener('close', handleClose)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>): void => {
    if (e.target === ref.current) onClose()
  }

  return (
    <dialog
      ref={ref}
      aria-label={ariaLabel}
      onClick={handleBackdropClick}
      className={cn(
        // Reset browser default <dialog> styles
        'p-0 bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        // Layout
        'rounded-kiosk shadow-xl overflow-hidden',
        SIZE_CLASSES[size],
      )}
    >
      <div className="bg-surface-50 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </dialog>
  )
}

/** Convenience header row with a title and an optional close button. */
export function DialogHeader({
  title,
  onClose,
}: {
  title: string
  onClose?: () => void
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-surface-900">{title}</h2>
      {onClose && (
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="rounded p-1 text-surface-500 hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-brand-400 outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
