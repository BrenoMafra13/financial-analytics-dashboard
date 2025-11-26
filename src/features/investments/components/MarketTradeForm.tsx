import { type FormEvent, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useMarketAssets } from '../hooks/useMarketAssets'
import { tradeInvestment } from '@/services/investments'
import { isAxiosError } from 'axios'

export function MarketTradeForm() {
  const { data: assets = [], isError, refetch, isFetching } = useMarketAssets()
  const { data: accounts = [] } = useAccounts()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ asset: '', accountId: '', quantity: '', side: 'BUY' as 'BUY' | 'SELL' })
  const [error, setError] = useState<string | null>(null)
  const displayAssets = assets
  const assetsEmpty = displayAssets.length === 0

  const mutation = useMutation({
    mutationFn: tradeInvestment,
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['investments'] })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['kpi-summary'] })
      setForm((prev) => ({ ...prev, quantity: '' }))
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError(err instanceof Error ? err.message : 'Unable to place order')
      }
    },
  })

  const selectedAsset = displayAssets.find((a) => `${a.symbol}-${a.type}` === form.asset)
  const selectedAccount = accounts.find((a) => a.id === form.accountId)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedAsset || !selectedAccount || !form.quantity) {
      setError('Please select an asset, account, and quantity.')
      return
    }
    setError(null)
    mutation.mutate({
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      type: selectedAsset.type as 'STOCK' | 'ETF' | 'CRYPTO' | 'FUND' | 'BOND',
      quantity: Number(form.quantity),
      side: form.side,
      accountId: selectedAccount.id,
      currency: selectedAccount.currency as 'USD' | 'CAD',
    })
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle>Trade (live prices)</CardTitle>
        <CardDescription>Select an asset and place a buy/sell with your account balance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <Select
              value={form.asset}
              onChange={(e) => setForm((prev) => ({ ...prev, asset: e.target.value }))}
              className="w-full"
              disabled={assetsEmpty}
            >
              <option value="" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                Select asset (crypto/stocks)
              </option>
              {displayAssets.map((asset) => (
                <option
                  key={`${asset.symbol}-${asset.type}`}
                  value={`${asset.symbol}-${asset.type}`}
                  className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white"
                >
                  {asset.symbol} ({asset.type}) • {asset.currentPrice.toFixed(2)} {asset.currency}
                </option>
              ))}
            </Select>
            <Select
              value={form.accountId}
              onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
              className="w-full"
            >
              <option value="" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                Select account
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                  {acc.name} • {acc.currency} • {acc.balance.toFixed(2)}
                </option>
              ))}
            </Select>
            <Select
              value={form.side}
              onChange={(e) => setForm((prev) => ({ ...prev, side: e.target.value as 'BUY' | 'SELL' }))}
              className="w-full"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </Select>
          </div>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              required
            />
            {selectedAsset ? (
              <p className="text-sm text-surface-600 dark:text-slate-200">
                Price: {selectedAsset.currentPrice.toFixed(2)} {selectedAsset.currency}
              </p>
            ) : null}
            {assetsEmpty ? (
              <p className="text-sm text-surface-600 dark:text-slate-200">
                No assets available. Try again shortly or use fallback list.
              </p>
            ) : null}
            {isError ? (
              <div className="text-sm text-danger">
                Unable to load live assets.
                <Button variant="ghost" size="sm" className="ml-2" type="button" onClick={() => void refetch()} disabled={isFetching}>
                  Retry
                </Button>
              </div>
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit order'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
