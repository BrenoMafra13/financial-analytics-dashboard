import { useMemo, useState } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/services/categories'
import { useExpenseBreakdown } from '@/features/dashboard/hooks/useExpenseBreakdown'
import { useExpenseTransactions } from '../hooks/useExpenseTransactions'
import { TransactionFiltersBar } from '@/components/filters/TransactionFiltersBar'
import { NewTransactionForm } from '@/features/transactions/components/NewTransactionForm'
import { useCurrency } from '@/hooks/useCurrency'
import { useUserStore } from '@/store/user'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date))
}

export function ExpensesPage() {
  const [page, setPage] = useState(1)
  const { format, convert, currency } = useCurrency()
  const user = useUserStore((state) => state.user)
  const pageSize = 6
  const { data: breakdown, isLoading: loadingBreakdown, isError: errorBreakdown } = useExpenseBreakdown()
  const { data: expenses, isLoading, isError } = useExpenseTransactions(page, pageSize)
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  const budgetAmount = user?.budget ?? 2000
  const budgetCurrency = (user?.currency as 'USD' | 'CAD') ?? 'USD'

  const spent = useMemo(() => {
    const items = expenses?.items ?? []
    const sum = items.reduce((acc, tx) => acc + Math.abs(convert(tx.amount, tx.currency as 'USD' | 'CAD')), 0)
    return { sum, currency }
  }, [convert, currency, expenses])

  const convertedBudget = useMemo(
    () => convert(budgetAmount, budgetCurrency as 'USD' | 'CAD'),
    [budgetAmount, budgetCurrency, convert],
  )

  const progress = useMemo(() => {
    if (!spent) return 0
    const budget = convertedBudget || budgetAmount
    return Math.min(100, (spent.sum / budget) * 100)
  }, [convertedBudget, spent])

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-3xl font-bold text-surface-900 dark:text-white">Expenses</h2>
        <Badge variant="danger" className="text-sm font-semibold px-4 py-2 bg-white text-surface-900 shadow-sm dark:bg-surface-800 dark:text-white">
          Budget: <span className="font-bold">{format(convertedBudget, currency)}</span> • Spent:{' '}
          <span className="font-bold">{format(spent.sum ?? 0, currency)}</span>
        </Badge>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-slate-300">
          Search expenses
        </h3>
        <TransactionFiltersBar />
      </div>
      <NewTransactionForm />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-0">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
            <CardTitle>Expense breakdown</CardTitle>
            <Select defaultValue="30" className="w-36 text-surface-900 dark:text-white">
              <option value="7" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                Last 7 days
              </option>
              <option value="30" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                Last 30 days
              </option>
              <option value="90" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                Last quarter
              </option>
            </Select>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {loadingBreakdown ? (
              <Skeleton className="h-64 w-full rounded-3xl" />
            ) : errorBreakdown || !breakdown ? (
              <p className="text-sm text-danger">Unable to load breakdown.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {breakdown.map((item) => (
                  <div key={item.categoryId} className="rounded-2xl border border-surface-100 p-4 dark:border-white/10">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{item.label}</p>
                    <p className="text-lg font-semibold text-surface-900 dark:text-white">
                      {format(convert(item.value, budgetCurrency as 'USD' | 'CAD'), currency)}
                    </p>
                    <div className="mt-2 h-2.5 rounded-full bg-surface-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{ width: '100%', backgroundColor: item.color ?? '#06c087' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="px-6 py-4">
            <CardTitle>Budget vs actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            <div className="flex items-center justify-between text-sm font-semibold text-surface-900 dark:text-white">
              <span>Budget</span>
              <span>{format(convertedBudget, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-surface-900 dark:text-white">
              <span>Spent</span>
              <span>{format(spent.sum ?? 0, currency)}</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-surface-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-danger to-warning"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-surface-500 dark:text-slate-400">{progress.toFixed(1)}% of your monthly budget used.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-0">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
          <CardTitle>Recent expenses</CardTitle>
          <p className="text-sm text-surface-600 dark:text-slate-200">
            Page {expenses?.page ?? 1} of {expenses?.totalPages ?? 1}
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-3xl" />
          ) : isError || !expenses ? (
            <p className="px-6 text-sm text-danger">Unable to load expenses.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 text-surface-500 dark:border-white/10 dark:text-slate-300">
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Description</th>
                      <th className="px-6 py-3 font-semibold">Category</th>
                      <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.items.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-surface-100 last:border-0 dark:border-white/5 hover:bg-surface-50/80 dark:hover:bg-white/5"
                      >
                        <td className="px-6 py-3 text-surface-500 dark:text-slate-300">{formatDate(tx.date)}</td>
                        <td className="px-6 py-3 text-surface-900 dark:text-white">{tx.description}</td>
                        <td className="px-6 py-3 text-surface-500 dark:text-slate-300">
                          {categoriesQuery.data?.find((c) => c.id === tx.categoryId)?.name ?? 'Other'}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-danger">
                          {format(tx.amount, tx.currency as 'USD' | 'CAD')}
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
                  disabled={page >= (expenses?.totalPages ?? 1)}
                  onClick={() => setPage((p) => Math.min(expenses?.totalPages ?? 1, p + 1))}
                  className="text-surface-600 dark:text-slate-200"
                >
                  Next
                  <ChevronsRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
