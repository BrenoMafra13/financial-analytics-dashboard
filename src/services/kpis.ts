import { api } from './http'
import type { KpiSummary } from '@/types'

export async function fetchKpiSummary() {
  const { data } = await api.get<KpiSummary>('/kpis')
  return data
}
