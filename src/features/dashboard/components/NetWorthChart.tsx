import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory'
import type { NetWorthPoint } from '@/types'

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
  } catch {
    return `$${value.toFixed(0)}`
  }
}

function NetWorthTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: { value: number; payload: NetWorthPoint }[]
  label?: string
  currency: string
}) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-surface-200 bg-white/95 p-3 text-sm shadow-card dark:border-white/10 dark:bg-surface-900/95">
      <p className="text-xs text-surface-500 dark:text-slate-400">{formatDateLabel(label ?? point.date)}</p>
      <p className="text-base font-semibold text-surface-900 dark:text-white">{formatCurrency(point.total, currency)}</p>
      <p className="text-xs text-surface-500 dark:text-slate-400">
        Accounts {formatCurrency(point.accounts, currency)} • Investments {formatCurrency(point.investments, currency)}
      </p>
    </div>
  )
}

export function NetWorthChart() {
  const { data, isLoading, isError } = useNetWorthHistory(120)
  const chartData = useMemo(() => data?.points ?? [], [data])
  const currency = data?.currency ?? 'USD'

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
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10 }}>
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
              tickFormatter={(v) => formatCurrency(Number(v), currency)}
            />
            <Tooltip content={<NetWorthTooltip currency={currency} />} />
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
      </CardContent>
    </Card>
  )
}
