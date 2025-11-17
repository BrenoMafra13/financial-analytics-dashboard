import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-100 text-surface-600 dark:bg-white/10 dark:text-white',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  )
}
