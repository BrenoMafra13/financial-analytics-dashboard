import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const mockNetWorth = [
  { date: 'Sep', value: 68000 },
  { date: 'Oct', value: 70500 },
  { date: 'Nov', value: 74200 },
  { date: 'Dec', value: 78500 },
  { date: 'Jan', value: 81200 },
]

export function NetWorthChart() {
  const isLoading = false
  const isError = false

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-3xl" />
  }

  if (isError) {
    return <p className="text-sm text-danger">Unable to load chart data.</p>
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle className="text-lg">Net worth over time</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={mockNetWorth}>
            <defs>
              <linearGradient id="networth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06c087" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#06c087" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Area
              type="monotone"
              dataKey="value"
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
