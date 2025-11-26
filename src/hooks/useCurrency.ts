import { useEffect, useCallback } from 'react'
import { useCurrencyStore, convertAmount } from '@/store/currency'
import { useUserStore } from '@/store/user'

export function useCurrency() {
  const userCurrency = useUserStore((state) => state.user?.currency) as 'USD' | 'CAD' | undefined
  const target = useCurrencyStore((state) => state.target)
  const rates = useCurrencyStore((state) => state.rates)
  const loading = useCurrencyStore((state) => state.loading)
  const error = useCurrencyStore((state) => state.error)
  const setTarget = useCurrencyStore((state) => state.setTarget)
  const refreshRates = useCurrencyStore((state) => state.refreshRates)

  useEffect(() => {
    if (userCurrency && userCurrency !== target) {
      setTarget(userCurrency)
    }
  }, [userCurrency, target, setTarget])

  useEffect(() => {
    refreshRates()
  }, [target, refreshRates])

  const convert = useCallback(
    (amount: number, from: 'USD' | 'CAD' = target) => convertAmount(amount, from, target, rates),
    [rates, target],
  )

  const format = useCallback(
    (amount: number, from: 'USD' | 'CAD' = target) => {
      const value = convert(amount, from)
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: target }).format(value)
      } catch {
        return `${target} ${value.toFixed(2)}`
      }
    },
    [convert, target],
  )

  return {
    currency: target,
    rates,
    loading,
    error,
    convert,
    format,
    refreshRates,
  }
}
