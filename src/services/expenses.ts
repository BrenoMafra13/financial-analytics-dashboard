import { api } from './http'

export async function fetchExpenseBreakdown(params?: { from?: string; to?: string }) {
  const { data } = await api.get('/expenses/breakdown', { params })
  return data as { categoryId: string; label: string; value: number; color?: string }[]
}
