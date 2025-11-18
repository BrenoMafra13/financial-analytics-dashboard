import { useQuery } from '@tanstack/react-query'
import { fetchExpenseBreakdown } from '@/services'
import { useFilterStore } from '@/store/filters'

export function useExpenseBreakdown() {
  const filters = useFilterStore((state) => state.transactionFilters)

  return useQuery({
    queryKey: ['expense-breakdown', filters],
    queryFn: () => fetchExpenseBreakdown(),
  })
}
