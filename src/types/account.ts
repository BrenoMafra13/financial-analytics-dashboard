export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'BROKERAGE' | 'WALLET'

export interface Account {
  id: string
  name: string
  institution?: string
  type: AccountType
  currency: string
  balance: number
  lastUpdated: string
}
