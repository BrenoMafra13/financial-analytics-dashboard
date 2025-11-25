export interface NetWorthPoint {
  date: string
  total: number
  accounts: number
  investments: number
}

export interface NetWorthHistory {
  currency: string
  points: NetWorthPoint[]
}
