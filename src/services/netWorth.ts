import { api } from './http'
import type { NetWorthHistory } from '@/types'
import type { TransactionFilters } from '@/types'

export async function fetchNetWorthHistory(days = 90, filters?: TransactionFilters) {
  const clampedDays = Math.min(365, Math.max(7, days))
  const params = {
    days: clampedDays,
    type: filters?.type,
    categoryId: filters?.categoryId,
    search: filters?.search,
    from: filters?.period.from,
    to: filters?.period.to,
  }
  const { data } = await api.get<NetWorthHistory>('/net-worth', { params })
  return data
}
