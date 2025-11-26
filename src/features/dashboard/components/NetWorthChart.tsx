import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory'
import { useCurrency } from '@/hooks/useCurrency'
import type { NetWorthPoint } from '@/types'

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function NetWorthTooltip({
  active,
  payload,
  label,
  currencyFormatter,
}: {
  active?: boolean
  payload?: { value: number; payload: NetWorthPoint }[]
  label?: string
  currencyFormatter: (value: number) => string
}) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-surface-200 bg-white/95 p-3 text-sm shadow-card dark:border-white/10 dark:bg-surface-900/95">
      <p className="text-xs text-surface-600 dark:text-slate-200">{formatDateLabel(label ?? point.date)}</p>
      <p className="text-base font-semibold text-surface-900 dark:text-white">{currencyFormatter(point.total)}</p>
      <p className="text-xs text-surface-600 dark:text-slate-200">
        Accounts {currencyFormatter(point.accounts)} • Investments {currencyFormatter(point.investments)}
      </p>
    </div>
  )
}

export function NetWorthChart() {
  const { data, isLoading, isError } = useNetWorthHistory(120)
  const { convert, format, currency } = useCurrency()
  const baseCurrency = (data?.currency as 'USD' | 'CAD' | undefined) ?? 'USD'
  const chartData = useMemo(
    () =>
      (data?.points ?? []).map((point) => ({
        ...point,
        total: convert(point.total, baseCurrency),
        accounts: convert(point.accounts, baseCurrency),
        investments: convert(point.investments, baseCurrency),
      })),
    [baseCurrency, convert, data?.points],
  )

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-3xl" />
  }

  if (isError) {
    return <p className="text-sm text-danger">Unable to load chart data.</p>
  }

  if (!chartData.length) {
    return <p className="text-sm text-surface-500 dark:text-slate-400">Add accounts or transactions to see your net worth.</p>
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle className="text-lg">Net worth over time</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <div className="overflow-visible">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ left: 60, right: 20, top: 10, bottom: 12 }}>
            <defs>
              <linearGradient id="networth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06c087" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#06c087" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" stroke="currentColor" opacity={0.6} tickFormatter={formatDateLabel} minTickGap={24} />
              <YAxis
                stroke="currentColor"
                opacity={0.6}
                width={70}
                tickFormatter={(v) => format(Number(v), currency)}
              />
            <Tooltip content={<NetWorthTooltip currencyFormatter={(value) => format(value, currency)} />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#06c087"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#networth)"
            />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
