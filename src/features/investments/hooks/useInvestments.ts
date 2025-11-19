import { useQuery } from '@tanstack/react-query'
import { fetchInvestments } from '@/services'

export function useInvestments() {
  return useQuery({
    queryKey: ['investments'],
    queryFn: fetchInvestments,
  })
}
