import { Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ThemeToggle } from './ThemeToggle'
import { useFilterStore } from '@/store/filters'

const periodOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last quarter' },
  { value: '365d', label: 'Last year' },
  { value: 'ytd', label: 'Year to date' },
]

const typeOptions = [
  { value: 'ALL', label: 'All' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
]

export function TopBar() {
  const period = useFilterStore((state) => state.transactionFilters.period.preset)
  const type = useFilterStore((state) => state.transactionFilters.type)
  const setPeriodPreset = useFilterStore((state) => state.setPeriodPreset)
  const setType = useFilterStore((state) => state.setType)

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-200 bg-white/70 px-6 py-4 text-surface-900 backdrop-blur dark:border-white/5 dark:bg-surface-950/60 dark:text-white">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">Overview</p>
        <h1 className="text-xl font-semibold">Breno Finance</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden w-44 sm:block">
          <Select
            value={period}
            onChange={(e) => setPeriodPreset(e.target.value as typeof period)}
            className="bg-transparent text-surface-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {periodOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white"
              >
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-surface-200 bg-white/80 px-1 py-1 text-xs font-semibold text-surface-600 dark:border-white/10 dark:bg-white/5 dark:text-white md:flex">
          {typeOptions.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={type === opt.value ? 'secondary' : 'ghost'}
              size="sm"
              className={type === opt.value ? 'bg-brand-500/20 text-brand-700 dark:text-white' : 'text-surface-600 dark:text-slate-200'}
              onClick={() => setType(opt.value as typeof type)}
            >
              {opt.label}
            </Button>
          ))}
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
