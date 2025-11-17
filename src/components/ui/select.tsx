import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <div className="relative w-full">
    <select
      ref={ref}
      className={cn(
        'w-full appearance-none rounded-2xl border border-surface-200 bg-white/80 px-4 py-2.5 pr-12 text-sm font-medium text-surface-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-offset-surface-950',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-slate-400" />
  </div>
))

Select.displayName = 'Select'
