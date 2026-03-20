import { api } from './http'
import type { User } from '@/types'
import type { TransactionFilters } from '@/types'

export async function updateProfile(payload: {
  name: string
  email: string
  currency: 'USD' | 'CAD'
  locale: string
  avatarUrl?: string | null
  budget?: number
}) {
  const { avatarUrl, ...rest } = payload
  const body = { ...rest, ...(typeof avatarUrl === 'string' && avatarUrl ? { avatarUrl } : {}), ...(payload.budget !== undefined ? { budget: payload.budget } : {}) }
  const { data } = await api.put<User>('/me', body)
  return data
}

export async function fetchCashflow(days = 30, filters?: TransactionFilters) {
  const params = {
    days,
    type: filters?.type,
    categoryId: filters?.categoryId,
    search: filters?.search,
    from: filters?.period.from,
    to: filters?.period.to,
  }
  const { data } = await api.get<{ income: number; expense: number; net: number; currency: string; days: number }>(
    '/cashflow',
    { params },
  )
  return data
}
