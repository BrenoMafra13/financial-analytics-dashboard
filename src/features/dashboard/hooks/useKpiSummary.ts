import { useQuery } from '@tanstack/react-query'
import { fetchKpiSummary } from '@/services'
import { useFilterStore } from '@/store/filters'

export function useKpiSummary() {
  const filters = useFilterStore((state) => state.transactionFilters)
  return useQuery({
    queryKey: ['kpi-summary', filters],
    queryFn: () => fetchKpiSummary(filters),
  })
}
