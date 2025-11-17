import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, helperText, ...props }, ref) => (
    <div className="space-y-1">
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full rounded-2xl border border-surface-200 bg-white/80 px-4 py-3 text-base text-surface-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-offset-surface-950',
          error ? 'border-danger text-danger focus:border-danger focus:ring-danger/20' : null,
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {(error || helperText) && (
        <p className={cn('text-sm', error ? 'text-danger' : 'text-surface-400 dark:text-slate-400')}>
          {error ?? helperText}
        </p>
      )}
    </div>
  ),
)
Input.displayName = 'Input'
