export type PeriodPreset = '7d' | '30d' | '90d' | '365d' | 'ytd'
export type TransactionFilterType = 'ALL' | 'INCOME' | 'EXPENSE'

export interface DateRange {
  preset: PeriodPreset
  from: string
  to: string
}

export interface TransactionFilters {
  period: DateRange
  type: TransactionFilterType
  categoryId?: string
  search?: string
}
