import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DateRange, TransactionFilters, TransactionFilterType } from '@/types'

const defaultRange: DateRange = {
  preset: '30d',
  from: '2024-12-07',
  to: '2025-01-06',
}

interface FilterState {
  transactionFilters: TransactionFilters
  setPeriod: (range: DateRange) => void
  setType: (type: TransactionFilterType) => void
  setCategory: (categoryId?: string) => void
  setSearch: (search?: string) => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      transactionFilters: {
        period: defaultRange,
        type: 'ALL',
      },
      setPeriod: (range) => set((state) => ({ transactionFilters: { ...state.transactionFilters, period: range } })),
      setType: (type) => set((state) => ({ transactionFilters: { ...state.transactionFilters, type } })),
      setCategory: (categoryId) =>
        set((state) => ({ transactionFilters: { ...state.transactionFilters, categoryId } })),
      setSearch: (search) => set((state) => ({ transactionFilters: { ...state.transactionFilters, search } })),
    }),
    {
      name: 'financial-analytics-filters',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
