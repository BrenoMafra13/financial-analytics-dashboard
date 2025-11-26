import { create } from 'zustand'
import { fetchFxRates } from '@/services/fx'
import { useUserStore } from './user'

type SupportedCurrency = 'USD' | 'CAD'

interface CurrencyState {
  target: SupportedCurrency
  rates: Record<SupportedCurrency, number>
  loading: boolean
  error?: string
  setTarget: (currency: SupportedCurrency) => void
  refreshRates: () => Promise<void>
}

const initialTarget = (useUserStore.getState().user?.currency as SupportedCurrency) || 'USD'

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  target: initialTarget,
  rates: { USD: 1, CAD: 1.35 },
  loading: false,
  error: undefined,
  setTarget: (currency) => set({ target: currency }),
  refreshRates: async () => {
    const current = get()
    if (current.loading) return
    set({ loading: true, error: undefined })
    try {
      const rates = await fetchFxRates()
      set({ rates, loading: false })
    } catch (err) {
      console.error('FX fetch error', err)
      set({ loading: false, error: 'Unable to refresh exchange rates' })
    }
  },
}))

export function convertAmount(amount: number, from: SupportedCurrency, to: SupportedCurrency, rates: Record<SupportedCurrency, number>) {
  if (from === to) return amount
  const fromRate = rates[from] || 1
  const toRate = rates[to] || 1
  const usdValue = amount / fromRate
  return usdValue * toRate
}
