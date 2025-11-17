import type { Category } from './category'

export type TransactionType = 'INCOME' | 'EXPENSE'

export interface Transaction {
  id: string
  date: string
  description: string
  type: TransactionType
  categoryId: Category['id']
  accountId: string
  amount: number
  currency: string
  tags?: string[]
}
