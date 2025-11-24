import { api } from './http'
import type { User } from '@/types'

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<{ token: string; user: User }>('/auth/login', payload)
  return data
}

export async function guestLogin() {
  const { data } = await api.post<{ token: string; user: User }>('/auth/guest')
  return data
}

export async function register(payload: {
  name: string
  email: string
  password: string
  currency: string
  locale: string
}) {
  const { data } = await api.post<{ token: string; user: User }>('/auth/register', payload)
  return data
}

export async function fetchCurrentUser() {
  const { data } = await api.get<User>('/me')
  return data
}
