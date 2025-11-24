import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvestments } from '../hooks/useInvestments'
import type { Investment } from '@/types'
import { MarketTradeForm } from '../components/MarketTradeForm'

const typeLabels: Record<Investment['type'], string> = {
  STOCK: 'Stock',
  ETF: 'ETF',
  CRYPTO: 'Crypto',
  FUND: 'Fund',
  BOND: 'Bond',
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

export function InvestmentsPage() {
  const { data = [], isLoading, isError, refetch } = useInvestments()
  const items = useMemo(() => data ?? [], [data])

  const totalInvested = useMemo(() => {
    if (!items.length) return null
    const total = items.reduce((acc, inv) => acc + inv.quantity * inv.currentPrice, 0)
    return { total, currency: items[0].currency }
  }, [items])

  const allocation = useMemo(() => {
    if (!items.length) return []
    const byType = items.reduce<Record<string, number>>((acc, inv) => {
      acc[inv.type] = (acc[inv.type] ?? 0) + inv.quantity * inv.currentPrice
      return acc
    }, {})
    const total = Object.values(byType).reduce((acc, v) => acc + v, 0)
    return Object.entries(byType).map(([type, value]) => ({
      type,
      label: typeLabels[type as Investment['type']],
      value,
      percentage: total ? (value / total) * 100 : 0,
    }))
  }, [items])

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white">Investments</h2>
        {data && totalInvested ? (
          <Badge variant="success">Total: {formatCurrency(totalInvested.total, totalInvested.currency)}</Badge>
        ) : null}
      </div>

      <MarketTradeForm />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-56 rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-danger">Unable to load investments.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-surface-500 dark:text-slate-400">
            No investments yet. Add holdings to see performance and allocation.
          </p>
        </Card>
      ) : (
        <>
          <Card className="p-0">
            <CardHeader className="px-6 py-4">
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-6">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={items[0].history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                  <XAxis dataKey="date" stroke="currentColor" opacity={0.6} />
                  <YAxis
                    stroke="currentColor"
                    opacity={0.6}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="value" stroke="#38bdf8" fillOpacity={0.2} fill="#38bdf8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-0">
              <CardHeader className="px-6 py-4">
                <CardTitle>Holdings</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-surface-100 px-0 dark:divide-white/5">
                {items.map((investment) => (
                  <div key={investment.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{investment.name}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-surface-500 dark:text-slate-400">
                        {investment.symbol} • {typeLabels[investment.type]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-surface-500 dark:text-slate-400">
                        {investment.quantity} units • {formatCurrency(investment.currentPrice, investment.currency)}
                      </p>
                      <p className="text-lg font-semibold text-surface-900 dark:text-white">
                        {formatCurrency(investment.quantity * investment.currentPrice, investment.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardHeader className="px-6 py-4">
                <CardTitle>Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
                {allocation.map((item) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between text-sm font-semibold text-surface-900 dark:text-white">
                      <span>{item.label}</span>
                      <span>{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-2.5 rounded-full bg-surface-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-info"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  )
}
