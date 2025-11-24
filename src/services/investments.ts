import { api } from './http'
import type { Investment } from '@/types'

export async function fetchInvestments() {
  const { data } = await api.get<Investment[]>('/investments')
  return data.map((inv) => ({ ...inv, history: inv.history ?? buildHistory(inv) }))
}

export async function fetchMarketAssets() {
  const { data } = await api.get<{ symbol: string; name: string; type: string; currentPrice: number; currency: string }[]>(
    '/market/assets',
  )
  return data
}

export async function tradeInvestment(payload: {
  symbol: string
  name: string
  type: Investment['type']
  quantity: number
  side: 'BUY' | 'SELL'
  accountId: string
  currency: 'USD' | 'CAD'
}) {
  await api.post('/investments/trade', payload)
}

function buildHistory(inv: Investment): Investment['history'] {
  const months = ['2024-11-01', '2024-12-01', '2025-01-01']
  return months.map((date, idx) => ({
    date,
    value: inv.currentPrice * (0.92 + idx * 0.04),
  }))
}
