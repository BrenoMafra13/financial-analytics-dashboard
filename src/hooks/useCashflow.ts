import { useQuery } from '@tanstack/react-query'
import { fetchCashflow } from '@/services/user'

export function useCashflow(days = 30) {
  return useQuery({ queryKey: ['cashflow', days], queryFn: () => fetchCashflow(days), refetchInterval: 60_000 })
}
