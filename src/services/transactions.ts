import { api } from './http'
import type { PagedResult, Transaction, TransactionFilters } from '@/types'

export async function fetchTransactions(filters: TransactionFilters, page = 1, pageSize = 10) {
  const params = {
    type: filters.type,
    categoryId: filters.categoryId,
    search: filters.search,
    page,
    pageSize,
    from: filters.period.from,
    to: filters.period.to,
  }
  const { data } = await api.get<PagedResult<Transaction>>('/transactions', { params })
  return data
}

export async function createTransaction(payload: Omit<Transaction, 'id'>) {
  const { data } = await api.post<Transaction>('/transactions', payload)
  return data
}
