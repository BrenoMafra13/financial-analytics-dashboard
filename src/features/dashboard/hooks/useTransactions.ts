import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '@/services'
import { useFilterStore } from '@/store/filters'

export function useTransactions(page = 1, pageSize = 8) {
  const filters = useFilterStore((state) => state.transactionFilters)

  return useQuery({
    queryKey: ['transactions', filters, page, pageSize],
    queryFn: () => fetchTransactions(filters, page, pageSize),
    staleTime: 1000 * 60,
  })
}
