import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvestments } from '../hooks/useInvestments'
import type { Investment } from '@/types'
import { MarketTradeForm } from '../components/MarketTradeForm'
import { useCurrency } from '@/hooks/useCurrency'
import { Button } from '@/components/ui/button'

const typeLabels: Record<Investment['type'], string> = {
  STOCK: 'Stock',
  ETF: 'ETF',
  CRYPTO: 'Crypto',
  FUND: 'Fund',
  BOND: 'Bond',
}

export function InvestmentsPage() {
  const { data = [], isLoading, isError, refetch } = useInvestments()
  const { format, convert, currency } = useCurrency()
  const items = useMemo(() => data ?? [], [data])

  const totalInvested = useMemo(() => {
    if (!items.length) return null
    const total = items.reduce((acc, inv) => acc + convert(inv.quantity * inv.currentPrice, inv.currency as 'USD' | 'CAD'), 0)
    return { total, currency }
  }, [convert, currency, items])

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
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-3xl font-bold text-surface-900 dark:text-white">Investments</h2>
        {data && totalInvested ? (
          <Badge variant="success" className="px-4 py-2 text-base font-semibold bg-white text-surface-900 shadow-sm dark:bg-surface-800 dark:text-white">
            Total: <span className="font-bold">{format(totalInvested.total, totalInvested.currency as 'USD' | 'CAD')}</span>
          </Badge>
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
          <p className="text-sm text-surface-600 dark:text-slate-200">
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
              <div className="overflow-visible">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart
                    data={items[0].history.map((point) => ({
                      ...point,
                      value: convert(point.value, items[0].currency as 'USD' | 'CAD'),
                    }))}
                    margin={{ left: 60, right: 20, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                    <XAxis dataKey="date" stroke="currentColor" opacity={0.6} />
                    <YAxis
                      stroke="currentColor"
                      opacity={0.6}
                      width={70}
                      tickFormatter={(v) => format(v as number, currency)}
                    />
                    <Tooltip formatter={(v: number) => format(v, currency)} />
                    <Area type="monotone" dataKey="value" stroke="#38bdf8" fillOpacity={0.2} fill="#38bdf8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
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
                      <p className="text-xs uppercase tracking-[0.3em] text-surface-600 dark:text-slate-200">
                        {investment.symbol} • {typeLabels[investment.type]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-surface-600 dark:text-slate-200">
                        {investment.quantity} units • {format(convert(investment.currentPrice, investment.currency as 'USD' | 'CAD'), currency)}
                      </p>
                      <p className="text-lg font-semibold text-surface-900 dark:text-white">
                        {format(convert(investment.quantity * investment.currentPrice, investment.currency as 'USD' | 'CAD'), currency)}
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
