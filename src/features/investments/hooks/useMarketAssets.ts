import { useQuery } from '@tanstack/react-query'
import { fetchMarketAssets } from '@/services/investments'

const fallbackAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO', currentPrice: 60000, currency: 'USD' },
  { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO', currentPrice: 3000, currency: 'USD' },
  { symbol: 'SOL', name: 'Solana', type: 'CRYPTO', currentPrice: 150, currency: 'USD' },
  { symbol: 'AAPL', name: 'Apple', type: 'STOCK', currentPrice: 190, currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'STOCK', currentPrice: 360, currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon', type: 'STOCK', currentPrice: 170, currency: 'USD' },
]

export function useMarketAssets() {
  return useQuery({
    queryKey: ['market-assets'],
    queryFn: fetchMarketAssets,
    initialData: fallbackAssets,
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnMount: 'always',
    retry: 1,
  })
}
