import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind classes correctly.
 * - clsx handles conditional/array/falsy class values
 * - twMerge resolves conflicting Tailwind utilities (last wins correctly)
 *
 * Use this everywhere instead of string array `.join(' ')`.
 *
 * @example cn('px-4 py-2', isActive && 'bg-brand-500', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
