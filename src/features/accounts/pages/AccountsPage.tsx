import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccounts } from '../hooks/useAccounts'
import type { Account } from '@/types'

const typeLabels: Record<Account['type'], string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit card',
  BROKERAGE: 'Brokerage',
  WALLET: 'Wallet',
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

export function AccountsPage() {
  const { data, isLoading, isError } = useAccounts()

  const totals = useMemo(() => {
    if (!data?.length) return null
    const sum = data.reduce((acc, account) => acc + account.balance, 0)
    const positive = data.filter((a) => a.balance >= 0).length
    return { sum, currency: data[0].currency, positive }
  }, [data])

  if (isLoading) {
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

  if (isError || !data) {
    return <p className="text-sm text-danger">Unable to load accounts.</p>
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white">Accounts</h2>
        {totals ? (
          <Badge variant={totals.sum >= 0 ? 'success' : 'danger'}>
            Total: {formatCurrency(totals.sum, totals.currency)}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-0">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg">Balances by account</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                  <XAxis dataKey="name" stroke="currentColor" opacity={0.6} />
                  <YAxis
                    stroke="currentColor"
                    opacity={0.6}
                    tickFormatter={(v) => `${v >= 0 ? '' : '-'}$${Math.abs(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number, _key, entry) => formatCurrency(v, (entry?.payload as Account).currency)} />
                  <Bar dataKey="balance" fill="#06c087" radius={12} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {data.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-surface-500 dark:text-slate-400">
                    {typeLabels[account.type]}
                  </p>
                  <p className="text-lg font-semibold text-surface-900 dark:text-white">{account.name}</p>
                  <p className="text-sm text-surface-500 dark:text-slate-400">{account.institution}</p>
                </div>
                <Badge variant={account.balance >= 0 ? 'success' : 'danger'}>
                  {account.balance >= 0 ? 'Asset' : 'Liability'}
                </Badge>
              </div>
              <p className={`mt-3 text-2xl font-semibold ${account.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(account.balance, account.currency)}
              </p>
              <p className="text-xs text-surface-500 dark:text-slate-400">Updated {account.lastUpdated}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
