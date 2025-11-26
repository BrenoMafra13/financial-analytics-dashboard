const FALLBACK_RATES: Record<'USD' | 'CAD', number> = {
  USD: 1,
  CAD: 1.35,
}

export async function fetchFxRates() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!response.ok) throw new Error('rate fetch failed')
    const json = await response.json()
    const cadRate = Number(json?.rates?.CAD)
    if (!Number.isFinite(cadRate) || cadRate <= 0) throw new Error('bad CAD rate')
    return { USD: 1, CAD: cadRate } as Record<'USD' | 'CAD', number>
  } catch {
    return FALLBACK_RATES
  }
}
