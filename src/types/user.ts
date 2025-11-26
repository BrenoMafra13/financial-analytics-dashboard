export type UserTier = 'standard' | 'premium' | 'private'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  locale: string
  currency: string
  tier: UserTier
  budget?: number
}
