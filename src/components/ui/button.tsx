import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-surface-950 shadow-glow transition duration-300 ease-expo-out hover:bg-brand-400 focus-visible:bg-brand-400 dark:text-surface-950',
  secondary:
    'bg-white text-surface-900 shadow-card hover:text-surface-950 dark:bg-surface-900/80 dark:text-white dark:shadow-none',
  outline:
    'border border-surface-200 text-surface-900 hover:border-brand-400 hover:text-surface-900 dark:border-white/15 dark:text-white',
  ghost: 'text-surface-500 hover:bg-surface-100 dark:text-slate-300 dark:hover:bg-white/10',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-11 w-11 p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 dark:focus-visible:ring-offset-surface-950 disabled:pointer-events-none disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-surface-700 dark:border-t-white" />
      )}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  ),
)

Button.displayName = 'Button'
