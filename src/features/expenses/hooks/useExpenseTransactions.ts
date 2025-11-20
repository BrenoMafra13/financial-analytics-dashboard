import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '@/services'
import { useFilterStore } from '@/store/filters'

export function useExpenseTransactions(page = 1, pageSize = 8) {
  const filters = useFilterStore((state) => state.transactionFilters)
  const expenseFilters = { ...filters, type: 'EXPENSE' as const }

  return useQuery({
    queryKey: ['expense-transactions', expenseFilters, page, pageSize],
    queryFn: () => fetchTransactions(expenseFilters, page, pageSize),
    staleTime: 1000 * 60,
  })
}
