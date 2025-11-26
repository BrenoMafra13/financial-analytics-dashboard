import { type FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { fetchCategories } from '@/services/categories'
import { createTransaction } from '@/services/transactions'

const types = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
]

export function NewTransactionForm() {
  const queryClient = useQueryClient()
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const defaultAccount = accounts[0]?.id ?? ''
  const [form, setForm] = useState({
    type: 'EXPENSE',
    accountId: defaultAccount,
    categoryId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const currency = useMemo(() => accounts.find((a) => a.id === form.accountId)?.currency ?? 'USD', [accounts, form.accountId])

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      setError(null)
      setSuccess('Saved')
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['kpi-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['expense-breakdown'] })
      setForm((prev) => ({ ...prev, description: '', amount: '' }))
      setTimeout(() => setSuccess(null), 1500)
    },
    onError: () => {
      setSuccess(null)
      setError('Unable to save transaction.')
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.accountId || !form.categoryId || !form.description || form.amount === '' || !form.date) {
      setError('Please fill all required fields.')
      return
    }
    setError(null)
    mutation.mutate({
      accountId: form.accountId,
      categoryId: form.categoryId,
      description: form.description,
      type: form.type as 'INCOME' | 'EXPENSE',
      amount: Number(form.amount),
      currency,
      date: form.date,
      tags: [],
    })
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle>New transaction</CardTitle>
        <CardDescription>Add income or expense and update balances.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <Select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full"
            >
              {types.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              value={form.accountId}
              onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
              className="w-full"
              required
            >
              <option value="" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                Select account
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                  {acc.name}
                </option>
              ))}
            </Select>
            <Select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full"
              required
            >
              <option value="" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                Select category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                  {cat.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
            <Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} required />
            <Input value={currency} disabled />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {success ? <p className="text-sm text-success">{success}</p> : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Add transaction'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
