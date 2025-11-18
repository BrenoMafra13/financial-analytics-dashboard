import { useQuery } from '@tanstack/react-query'
import { fetchKpiSummary } from '@/services'

export function useKpiSummary() {
  return useQuery({
    queryKey: ['kpi-summary'],
    queryFn: fetchKpiSummary,
  })
}
