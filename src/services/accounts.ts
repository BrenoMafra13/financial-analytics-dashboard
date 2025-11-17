import { simulateRequest } from './client'
import type { Account } from '@/types'

const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Checking',
    institution: 'Breno Bank',
    type: 'CHECKING',
    currency: 'USD',
    balance: 8200,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'acc-2',
    name: 'High-Yield Savings',
    institution: 'Breno Bank',
    type: 'SAVINGS',
    currency: 'USD',
    balance: 18500,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'acc-3',
    name: 'Brokerage',
    institution: 'Breno Invest',
    type: 'BROKERAGE',
    currency: 'USD',
    balance: 40250,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'acc-4',
    name: 'Credit Card',
    institution: 'Breno Card',
    type: 'CREDIT_CARD',
    currency: 'USD',
    balance: -950,
    lastUpdated: '2025-01-01',
  },
]

export async function fetchAccounts() {
  return simulateRequest({ data: accounts })
}
