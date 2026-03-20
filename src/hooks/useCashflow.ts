import { useQuery } from '@tanstack/react-query'
import { fetchCashflow } from '@/services/user'
import { useFilterStore } from '@/store/filters'

export function useCashflow(days = 30) {
  const filters = useFilterStore((state) => state.transactionFilters)
  return useQuery({
    queryKey: ['cashflow', days, filters],
    queryFn: () => fetchCashflow(days, filters),
    refetchInterval: 60_000,
  })
}
