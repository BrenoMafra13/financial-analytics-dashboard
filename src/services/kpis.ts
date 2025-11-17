import { simulateRequest } from './client'
import type { KpiSummary } from '@/types'

const kpis: KpiSummary = {
  totalBalance: 8200 + 18500 + 40250 - 950,
  investedAmount: 40250,
  monthlyExpenses: 1800 + 240 + 32 + 28 + 120,
  netWorthChangePct: 6.4,
  currency: 'USD',
}

export async function fetchKpiSummary() {
  return simulateRequest({ data: kpis })
}
