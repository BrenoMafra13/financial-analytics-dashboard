import { NavLink } from 'react-router-dom'
import { CreditCard, LayoutDashboard, LineChart, Settings, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { useCashflow } from '@/hooks/useCashflow'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Accounts', to: '/accounts', icon: Wallet },
  { label: 'Investments', to: '/investments', icon: LineChart },
  { label: 'Expenses', to: '/expenses', icon: CreditCard },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function Sidebar() {
  const { data: cashflow } = useCashflow(30)

  return (
    <aside className="hidden w-72 flex-col border-r border-surface-100 bg-white/80 px-5 py-8 text-surface-700 shadow-card backdrop-blur-xl dark:border-white/5 dark:bg-surface-950/90 dark:text-white lg:flex">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">
          Breno Finance
        </p>
        <p className="mt-2 text-lg font-semibold text-surface-900 dark:text-white">Control center</p>
      </div>

      <nav className="mt-8 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-500/15 text-surface-900 shadow-inner dark:text-white'
                    : 'text-surface-400 hover:text-surface-900 dark:text-slate-400 dark:hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-12 space-y-4 text-center">
        <div className="rounded-3xl border border-surface-100 bg-white/80 p-5 text-surface-900 shadow-card dark:border-white/10 dark:bg-white/5 dark:text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-surface-500 dark:text-white/60">Monthly cash flow</p>
          <p className="mt-2 text-3xl font-semibold">
            {cashflow ? `${cashflow.net >= 0 ? '' : '-'}${cashflow.currency} ${Math.abs(cashflow.net).toLocaleString()}` : '—'}
          </p>
          <Badge variant={cashflow && cashflow.net >= 0 ? 'success' : 'danger'} className="mt-3 w-fit px-3">
            {cashflow ? `${cashflow.days}d income ${cashflow.income.toLocaleString()} • expense ${cashflow.expense.toLocaleString()}` : 'Loading...'}
          </Badge>
        </div>
      </div>
    </aside>
  )
}
