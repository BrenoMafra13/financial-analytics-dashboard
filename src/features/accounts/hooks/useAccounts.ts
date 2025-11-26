import { useQuery } from '@tanstack/react-query'
import { fetchAccounts } from '@/services'
import { useUserStore } from '@/store/user'

export function useAccounts() {
  const token = useUserStore((state) => state.token)
  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
    enabled: Boolean(token),
    refetchOnMount: 'always',
    retry: 2,
  })
}
