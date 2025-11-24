import { useMemo, useState } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/features/dashboard/hooks/useTransactions'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/services/categories'
import type { Transaction } from '@/types'

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date))
}

function typeBadge(tx: Transaction) {
  return tx.amount >= 0 ? (
    <Badge variant="success">Income</Badge>
  ) : (
    <Badge variant="danger">Expense</Badge>
  )
}

export function TransactionsTable() {
  const [page, setPage] = useState(1)
  const pageSize = 6
  const { data, isLoading, isError } = useTransactions(page, pageSize)
  const categoriesCache = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  const rows = useMemo(() => data?.items ?? [], [data])

  if (isLoading) return <Skeleton className="h-72 w-full rounded-3xl" />
  if (isError || !data) return <p className="text-sm text-danger">Unable to load transactions.</p>

  return (
    <Card className="p-0">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
        <CardTitle className="text-lg">Recent transactions</CardTitle>
        <p className="text-sm text-surface-500 dark:text-slate-400">
          Page {data.page} of {data.totalPages}
        </p>
      </CardHeader>
      <CardContent className="px-0 pb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-surface-500 dark:border-white/10 dark:text-slate-300">
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-surface-100 last:border-0 dark:border-white/5 hover:bg-surface-50/80 dark:hover:bg-white/5"
                >
                  <td className="px-6 py-3 text-surface-500 dark:text-slate-300">{formatDate(tx.date)}</td>
                  <td className="px-6 py-3 text-surface-900 dark:text-white">{tx.description}</td>
                  <td className="px-6 py-3 text-surface-500 dark:text-slate-300">
                    {categoriesCache.data?.find((c) => c.id === tx.categoryId)?.name ?? 'Other'}
                  </td>
                  <td className="px-6 py-3">{typeBadge(tx)}</td>
                  <td
                    className={`px-6 py-3 text-right font-semibold ${
                      tx.amount >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 px-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-surface-600 dark:text-slate-200"
          >
            <ChevronsLeft className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            className="text-surface-600 dark:text-slate-200"
          >
            Next
            <ChevronsRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
