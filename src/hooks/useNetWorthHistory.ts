import { useQuery } from '@tanstack/react-query'
import { fetchNetWorthHistory } from '@/services/netWorth'

export function useNetWorthHistory(days = 90) {
  return useQuery({ queryKey: ['net-worth', days], queryFn: () => fetchNetWorthHistory(days), refetchInterval: 60_000 })
}
