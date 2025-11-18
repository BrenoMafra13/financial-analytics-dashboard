import { DollarSign, LineChart, PiggyBank, TrendingUp } from 'lucide-react'
import { KpiCard } from './KpiCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useKpiSummary } from '@/features/dashboard/hooks/useKpiSummary'

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

export function KpiGrid() {
  const { data, isLoading, isError } = useKpiSummary()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-32 rounded-3xl" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-sm text-danger">Unable to load KPIs.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total balance"
        value={formatCurrency(data.totalBalance, data.currency)}
        helper="All accounts combined"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KpiCard
        title="Invested amount"
        value={formatCurrency(data.investedAmount, data.currency)}
        helper="Across brokerage"
        icon={<LineChart className="h-4 w-4" />}
      />
      <KpiCard
        title="Monthly expenses"
        value={formatCurrency(data.monthlyExpenses, data.currency)}
        helper="Current period"
        icon={<PiggyBank className="h-4 w-4" />}
      />
      <KpiCard
        title="Net worth change"
        value={`${data.netWorthChangePct.toFixed(2)}%`}
        helper="Vs prior period"
        trendLabel={`${data.netWorthChangePct >= 0 ? '+' : ''}${data.netWorthChangePct.toFixed(2)}%`}
        trendVariant={data.netWorthChangePct >= 0 ? 'success' : 'danger'}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  )
}
