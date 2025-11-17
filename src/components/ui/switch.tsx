import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export interface SwitchProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange' | 'role' | 'type' | 'aria-checked'> {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full border border-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 dark:focus-visible:ring-offset-surface-950',
        checked ? 'bg-brand-500/80' : 'bg-surface-300/60 dark:bg-white/10',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  )
}
