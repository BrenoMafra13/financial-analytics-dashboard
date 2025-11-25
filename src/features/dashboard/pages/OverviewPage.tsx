import { KpiGrid } from '../components/KpiGrid'
import { NetWorthChart } from '../components/NetWorthChart'
import { ExpenseBreakdown } from '../components/ExpenseBreakdown'
import { TransactionsTable } from '../components/TransactionsTable'
import { TransactionFiltersBar } from '@/components/filters/TransactionFiltersBar'
import { useCashflow } from '@/hooks/useCashflow'
import { Card } from '@/components/ui/card'

export function OverviewPage() {
  const { data: cashflow } = useCashflow(30)
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-surface-500 dark:text-slate-400">Your overall performance at a glance.</p>
      </div>
      <KpiGrid />
      <TransactionFiltersBar />
      {cashflow ? (
        <Card className="p-4">
          <p className="text-sm text-surface-500 dark:text-slate-400">Last {cashflow.days} days cash flow</p>
          <p className="text-2xl font-semibold text-surface-900 dark:text-white">
            {cashflow.currency} {cashflow.net.toLocaleString()}
          </p>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NetWorthChart />
        </div>
        <ExpenseBreakdown />
      </div>
      <TransactionsTable />
    </section>
  )
}
