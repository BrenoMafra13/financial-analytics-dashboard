import { simulateRequest } from './client'
import type { Investment } from '@/types'

const investments: Investment[] = [
  {
    id: 'inv-1',
    symbol: 'AAPL',
    name: 'Apple Inc',
    type: 'STOCK',
    quantity: 40,
    currentPrice: 190,
    currency: 'USD',
    history: [
      { date: '2024-11-01', value: 170 },
      { date: '2024-12-01', value: 180 },
      { date: '2025-01-01', value: 190 },
    ],
  },
  {
    id: 'inv-2',
    symbol: 'VTI',
    name: 'Vanguard Total Market',
    type: 'ETF',
    quantity: 25,
    currentPrice: 245,
    currency: 'USD',
    history: [
      { date: '2024-11-01', value: 230 },
      { date: '2024-12-01', value: 238 },
      { date: '2025-01-01', value: 245 },
    ],
  },
  {
    id: 'inv-3',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'CRYPTO',
    quantity: 0.8,
    currentPrice: 42000,
    currency: 'USD',
    history: [
      { date: '2024-11-01', value: 36000 },
      { date: '2024-12-01', value: 39000 },
      { date: '2025-01-01', value: 42000 },
    ],
  },
]

export async function fetchInvestments() {
  return simulateRequest({ data: investments })
}
