import { useQuery } from '@tanstack/react-query'
import { fetchNetWorthHistory } from '@/services/netWorth'
import { useFilterStore } from '@/store/filters'

export function useNetWorthHistory(days = 90) {
  const filters = useFilterStore((state) => state.transactionFilters)
  return useQuery({
    queryKey: ['net-worth', days, filters],
    queryFn: () => fetchNetWorthHistory(days, filters),
    refetchInterval: 60_000,
  })
}
