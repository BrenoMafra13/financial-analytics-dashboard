import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccounts } from '../hooks/useAccounts'
import type { Account } from '@/types'
import { NewAccountForm } from '../components/NewAccountForm'
import { useCurrency } from '@/hooks/useCurrency'
import { Trash2 } from 'lucide-react'
import { deleteAccount } from '@/services/accounts'
import { useQueryClient } from '@tanstack/react-query'

const typeLabels: Record<Account['type'], string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit card',
  BROKERAGE: 'Brokerage',
  WALLET: 'Wallet',
}

export function AccountsPage() {
  const { data, isLoading, isError } = useAccounts()
  const { format, convert, currency } = useCurrency()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const safeNumber = (value: unknown) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const accounts = data ?? []

  const totals = useMemo(() => {
    if (!accounts.length) return null
    const sum = accounts.reduce(
      (acc, account) => acc + safeNumber(convert(safeNumber(account.balance), account.currency as 'USD' | 'CAD')),
      0,
    )
    const positive = accounts.filter((a) => a.balance >= 0).length
    return { sum, currency, positive }
  }, [accounts, convert, currency])

  const chartData = useMemo(
    () =>
      accounts.map((account) => ({
        ...account,
        balance: safeNumber(convert(safeNumber(account.balance), account.currency as 'USD' | 'CAD')),
        currency,
      })),
    [accounts, convert, currency],
  )

  if (isError) {
    return <p className="text-sm text-danger">Unable to load accounts.</p>
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-52 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-3xl font-bold text-surface-900 dark:text-white">Accounts</h2>
        {totals ? (
          <Badge
            variant={totals.sum >= 0 ? 'success' : 'danger'}
            className="px-4 py-2 text-base font-semibold bg-white text-surface-900 shadow-sm dark:bg-surface-800 dark:text-white"
          >
            Total: <span className="font-bold">{format(totals.sum, totals.currency as 'USD' | 'CAD')}</span>
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Balances by account</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-6">
              <div className="overflow-visible">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ left: 60, right: 20, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                    <XAxis dataKey="name" stroke="currentColor" opacity={0.6} />
                    <YAxis
                      stroke="currentColor"
                      opacity={0.6}
                      width={70}
                      tickFormatter={(v) => format(v as number, currency)}
                    />
                    <Tooltip
                      formatter={(v: number, _key, entry) =>
                        format(v, ((entry?.payload as Account)?.currency as 'USD' | 'CAD') || currency)
                      }
                    />
                    <Bar dataKey="balance" fill="#C1FF72" radius={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <NewAccountForm />
        </div>

        <div className="space-y-3">
          {data.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-surface-600 dark:text-slate-200">
                    {typeLabels[account.type]}
                  </p>
                  <p className="text-lg font-semibold text-surface-900 dark:text-white">{account.name}</p>
                  <p className="text-sm text-surface-600 dark:text-slate-200">{account.institution}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={account.balance >= 0 ? 'success' : 'danger'}>
                    {account.balance >= 0 ? 'Asset' : 'Liability'}
                  </Badge>
                  {!account.protected ? (
                    <button
                      type="button"
                      className="rounded-full bg-red-600 p-2 text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deletingId === account.id}
                      onClick={async () => {
                        if (deletingId) return
                        const confirmed = window.confirm(`Delete account "${account.name}"? This will remove its transactions.`)
                        if (!confirmed) return
                        try {
                          setDeletingId(account.id)
                          await deleteAccount(account.id)
                          void queryClient.invalidateQueries({ queryKey: ['accounts'] })
                          void queryClient.invalidateQueries({ queryKey: ['transactions'] })
                          void queryClient.invalidateQueries({ queryKey: ['kpi-summary'] })
                        } catch (err) {
                          alert('Unable to delete account. Make sure the balance is zero.')
                        } finally {
                          setDeletingId(null)
                        }
                      }}
                      aria-label={`Delete ${account.name}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className={`mt-3 text-2xl font-semibold ${account.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                {format(convert(account.balance, account.currency as 'USD' | 'CAD'), currency)}
              </p>
              <p className="text-xs text-surface-600 dark:text-slate-300">Updated {account.lastUpdated}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
