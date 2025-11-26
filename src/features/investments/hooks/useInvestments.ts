import { useQuery } from '@tanstack/react-query'
import { fetchInvestments } from '@/services'
import { useUserStore } from '@/store/user'

export function useInvestments() {
  const token = useUserStore((state) => state.token)
  return useQuery({
    queryKey: ['investments'],
    queryFn: fetchInvestments,
    initialData: [],
    enabled: Boolean(token),
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    retry: 2,
    staleTime: 0,
  })
}
