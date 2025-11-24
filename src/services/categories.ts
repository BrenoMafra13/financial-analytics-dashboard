import { api } from './http'
import type { Category } from '@/types'

export async function fetchCategories() {
  const { data } = await api.get<Category[]>('/categories')
  return data
}
