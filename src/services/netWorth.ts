import { api } from './http'
import type { NetWorthHistory } from '@/types'

export async function fetchNetWorthHistory(days = 90) {
  const clampedDays = Math.min(365, Math.max(7, days))
  const { data } = await api.get<NetWorthHistory>('/net-worth', { params: { days: clampedDays } })
  return data
}
