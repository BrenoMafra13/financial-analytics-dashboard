import { KpiGrid } from '../components/KpiGrid'
import { NetWorthChart } from '../components/NetWorthChart'
import { ExpenseBreakdown } from '../components/ExpenseBreakdown'
import { TransactionsTable } from '../components/TransactionsTable'
import { TransactionFiltersBar } from '@/components/filters/TransactionFiltersBar'

export function OverviewPage() {
  return (
    <section className="space-y-6">
      <KpiGrid />
      <TransactionFiltersBar />
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
