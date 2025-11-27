import { api } from './http'
import type { Account } from '@/types'

export async function fetchAccounts() {
  const { data } = await api.get<Account[]>('/accounts')
  return data
}

export async function createAccount(payload: Omit<Account, 'id' | 'lastUpdated' | 'balance'> & { balance: number }) {
  const { data } = await api.post<Account>('/accounts', payload)
  return data
}

export async function deleteAccount(id: string) {
  await api.delete(`/accounts/${id}`)
}
