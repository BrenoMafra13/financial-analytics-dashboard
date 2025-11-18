import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useExpenseBreakdown } from '@/features/dashboard/hooks/useExpenseBreakdown'

export function ExpenseBreakdown() {
  const { data, isLoading, isError } = useExpenseBreakdown()

  if (isLoading) return <Skeleton className="h-64 w-full rounded-3xl" />
  if (isError || !data) return <p className="text-sm text-danger">Unable to load expense breakdown.</p>

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle className="text-lg">Expense breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
