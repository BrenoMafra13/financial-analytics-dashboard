import { type FormEvent, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { createAccount } from '@/services/accounts'

const accountTypes = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT_CARD', label: 'Credit card' },
  { value: 'BROKERAGE', label: 'Brokerage' },
  { value: 'WALLET', label: 'Wallet' },
]
const currencyOptions = ['USD', 'CAD']

export function NewAccountForm() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['kpi-summary'] })
      setError(null)
      setForm({
        name: '',
        institution: '',
        type: 'CHECKING',
        currency: 'USD',
        balance: '',
      })
    },
    onError: () => setError('Unable to create account.'),
  })

  const [form, setForm] = useState({
    name: '',
    institution: '',
    type: 'CHECKING',
    currency: 'USD',
    balance: '',
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.name || !form.type || !form.currency || form.balance === '') {
      setError('Please fill all required fields.')
      return
    }
    setError(null)
    mutation.mutate({
      name: form.name,
      institution: form.institution || undefined,
      type: form.type as (typeof accountTypes)[number]['value'],
      currency: form.currency,
      balance: Number(form.balance),
    })
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle>Add account</CardTitle>
        <CardDescription>Track balances for new accounts or cards.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Account name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Institution (optional)"
              value={form.institution}
              onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full"
            >
              {accountTypes.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white"
                >
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              value={form.currency}
              onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
              className="w-full"
            >
              {currencyOptions.map((cur) => (
                <option
                  key={cur}
                  value={cur}
                  className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white"
                >
                  {cur}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="Balance"
              value={form.balance}
              onChange={(e) => setForm((prev) => ({ ...prev, balance: e.target.value }))}
              required
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving...' : 'Add account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
