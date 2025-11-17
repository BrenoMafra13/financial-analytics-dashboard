import { simulateRequest } from './client'
import { categories } from './categories'
import type { PagedResult, Transaction, TransactionFilters } from '@/types'

const transactions: Transaction[] = [
  {
    id: 'tx-1',
    date: '2025-01-02',
    description: 'Salary - Breno Corp',
    type: 'INCOME',
    categoryId: 'cat-1',
    accountId: 'acc-1',
    amount: 6200,
    currency: 'USD',
  },
  {
    id: 'tx-2',
    date: '2025-01-03',
    description: 'ETF contribution',
    type: 'INCOME',
    categoryId: 'cat-2',
    accountId: 'acc-3',
    amount: 850,
    currency: 'USD',
  },
  {
    id: 'tx-3',
    date: '2025-01-04',
    description: 'Rent - January',
    type: 'EXPENSE',
    categoryId: 'cat-3',
    accountId: 'acc-1',
    amount: -1800,
    currency: 'USD',
  },
  {
    id: 'tx-4',
    date: '2025-01-05',
    description: 'Groceries',
    type: 'EXPENSE',
    categoryId: 'cat-4',
    accountId: 'acc-1',
    amount: -240,
    currency: 'USD',
  },
  {
    id: 'tx-5',
    date: '2025-01-06',
    description: 'Ride share',
    type: 'EXPENSE',
    categoryId: 'cat-5',
    accountId: 'acc-1',
    amount: -32,
    currency: 'USD',
  },
  {
    id: 'tx-6',
    date: '2025-01-06',
    description: 'Streaming services',
    type: 'EXPENSE',
    categoryId: 'cat-6',
    accountId: 'acc-1',
    amount: -28,
    currency: 'USD',
  },
  {
    id: 'tx-7',
    date: '2025-01-06',
    description: 'Electricity bill',
    type: 'EXPENSE',
    categoryId: 'cat-7',
    accountId: 'acc-1',
    amount: -120,
    currency: 'USD',
  },
]

function applyFilters(data: Transaction[], filters: TransactionFilters): Transaction[] {
  return data.filter((tx) => {
    const dateInRange = tx.date >= filters.period.from && tx.date <= filters.period.to
    const typeMatches =
      filters.type === 'ALL' ? true : filters.type === 'INCOME' ? tx.amount > 0 : tx.amount < 0
    const categoryMatches = filters.categoryId ? tx.categoryId === filters.categoryId : true
    const searchMatches = filters.search
      ? tx.description.toLowerCase().includes(filters.search.toLowerCase())
      : true

    return dateInRange && typeMatches && categoryMatches && searchMatches
  })
}

function paginate<T>(data: T[], page: number, pageSize: number): PagedResult<T> {
  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const items = data.slice((page - 1) * pageSize, page * pageSize)

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}

export async function fetchTransactions(
  filters: TransactionFilters,
  page = 1,
  pageSize = 10,
): Promise<PagedResult<Transaction>> {
  const filtered = applyFilters(transactions, filters)
  return simulateRequest({ data: paginate(filtered, page, pageSize) })
}

export async function fetchExpenseBreakdown() {
  const expenses = transactions.filter((tx) => tx.amount < 0)
  const byCategory = expenses.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + Math.abs(tx.amount)
    return acc
  }, {})

  const breakdown = Object.entries(byCategory).map(([categoryId, value]) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return {
      categoryId,
      label: category?.name ?? 'Other',
      value,
      color: category?.color ?? '#94a3b8',
    }
  })

  return simulateRequest({ data: breakdown })
}
