import { api } from './http'
import type { KpiSummary } from '@/types'
import type { TransactionFilters } from '@/types'

export async function fetchKpiSummary(filters?: TransactionFilters) {
  const params = filters
    ? {
        type: filters.type,
        categoryId: filters.categoryId,
        search: filters.search,
        from: filters.period.from,
        to: filters.period.to,
      }
    : undefined
  const { data } = await api.get<KpiSummary>('/kpis', { params })
  return data
}
