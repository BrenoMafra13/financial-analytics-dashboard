import { simulateRequest } from './client'
import type { User } from '@/types'

const mockUser: User = {
  id: 'user-1',
  name: 'Breno Mafra',
  email: 'breno@finance.com',
  locale: 'en-US',
  currency: 'USD',
  tier: 'premium',
  avatarUrl: '',
}

export async function login() {
  return simulateRequest({ data: mockUser })
}

export async function fetchCurrentUser() {
  return simulateRequest({ data: mockUser })
}
