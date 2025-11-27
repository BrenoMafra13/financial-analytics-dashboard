import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DateRange, PeriodPreset, TransactionFilters, TransactionFilterType } from '@/types'

const computeRange = (preset: PeriodPreset): DateRange => {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)

  if (preset === 'ytd') {
    const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
    return { preset, from: start, to: end }
  }

  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - days)
  const start = startDate.toISOString().slice(0, 10)
  return { preset, from: start, to: end }
}

const getDefaultRange = (): DateRange => computeRange('30d')

interface FilterState {
  transactionFilters: TransactionFilters
  setPeriod: (range: DateRange) => void
  setPeriodPreset: (preset: PeriodPreset) => void
  setType: (type: TransactionFilterType) => void
  setCategory: (categoryId?: string) => void
  setSearch: (search?: string) => void
  reset: () => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      transactionFilters: {
        period: getDefaultRange(),
        type: 'ALL',
      },
      setPeriod: (range) => set((state) => ({ transactionFilters: { ...state.transactionFilters, period: range } })),
      setPeriodPreset: (preset) =>
        set((state) => ({ transactionFilters: { ...state.transactionFilters, period: computeRange(preset) } })),
      setType: (type) => set((state) => ({ transactionFilters: { ...state.transactionFilters, type } })),
      setCategory: (categoryId) =>
        set((state) => ({ transactionFilters: { ...state.transactionFilters, categoryId } })),
      setSearch: (search) => set((state) => ({ transactionFilters: { ...state.transactionFilters, search } })),
      reset: () =>
        set(() => ({
          transactionFilters: {
            period: getDefaultRange(),
            type: 'ALL',
            categoryId: undefined,
            search: undefined,
          },
        })),
    }),
    {
      name: 'financial-analytics-filters',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
