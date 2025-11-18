import { useQuery } from '@tanstack/react-query'
import { fetchAccounts } from '@/services'

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })
}
