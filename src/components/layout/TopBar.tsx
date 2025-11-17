import { Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ThemeToggle } from './ThemeToggle'

export function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-200 bg-white/70 px-6 py-4 text-surface-900 backdrop-blur dark:border-white/5 dark:bg-surface-950/60 dark:text-white">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">Overview</p>
        <h1 className="text-xl font-semibold">Breno Finance</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden w-48 sm:block">
          <Select
            defaultValue="30"
            className="bg-transparent text-surface-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="7" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
              Last 7 days
            </option>
            <option value="30" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
              Last 30 days
            </option>
            <option value="90" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
              Last quarter
            </option>
            <option value="365" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
              Year to date
            </option>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="border border-surface-200 text-surface-600 hover:bg-surface-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-white/80 px-3 py-1.5 text-surface-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
          <div className="h-9 w-9 rounded-full bg-gradient-brand" />
          <div className="text-left text-sm leading-tight">
            <p className="font-semibold">Breno Mafra</p>
            <p className="text-xs text-surface-500 dark:text-slate-400">Premium</p>
          </div>
          <ChevronDown className="h-4 w-4 text-surface-400 dark:text-slate-400" />
        </div>
      </div>
    </header>
  )
}
