export type InvestmentType = 'STOCK' | 'ETF' | 'CRYPTO' | 'FUND' | 'BOND'

export interface PricePoint {
  date: string
  value: number
}

export interface Investment {
  id: string
  symbol: string
  name: string
  type: InvestmentType
  quantity: number
  currentPrice: number
  currency: string
  history: PricePoint[]
}
