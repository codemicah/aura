// Hooks for market data and DeFi protocol integration
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/utils/api'

export interface ProtocolYield {
  protocol: 'benqi' | 'traderjoe' | 'yieldyak'
  apy: number
  tvl: string
  isActive: boolean
  lastUpdated?: Date
}

export interface MarketSummary {
  protocol: string
  apy: number
  tvl: string
  volume24h: string
  fees24h: string
  utilization: number
  timestamp: Date
}

// Hook for fetching protocol yields
export function useProtocolYields(refreshInterval?: number) {
  const [yields, setYields] = useState<ProtocolYield[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchYields = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getProtocolYields()
      
      // Ensure data is an array before mapping
      if (Array.isArray(data)) {
        const formattedYields: ProtocolYield[] = data.map(item => ({
          ...item,
          protocol: item.protocol as any,
          lastUpdated: new Date()
        }))
        
        setYields(formattedYields)
        setLastUpdated(new Date())
        setError(null)
      } else {
        // If no data or invalid format, use default yields
        const defaultYields: ProtocolYield[] = [
          { protocol: 'benqi', apy: 7.5, tvl: '0', isActive: true, lastUpdated: new Date() },
          { protocol: 'traderjoe', apy: 11.2, tvl: '0', isActive: true, lastUpdated: new Date() },
          { protocol: 'yieldyak', apy: 15.8, tvl: '0', isActive: true, lastUpdated: new Date() }
        ]
        setYields(defaultYields)
        setLastUpdated(new Date())
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch yields:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch yields')
      // Set default yields on error
      const defaultYields: ProtocolYield[] = [
        { protocol: 'benqi', apy: 7.5, tvl: '0', isActive: true, lastUpdated: new Date() },
        { protocol: 'traderjoe', apy: 11.2, tvl: '0', isActive: true, lastUpdated: new Date() },
        { protocol: 'yieldyak', apy: 15.8, tvl: '0', isActive: true, lastUpdated: new Date() }
      ]
      setYields(defaultYields)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchYields()
  }, [fetchYields])

  // Auto-refresh if interval provided
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchYields, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, fetchYields])

  return {
    yields,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchYields
  }
}

// Hook for AVAX price
export function useAVAXPrice(refreshInterval: number = 60000) {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      const data = await apiClient.getAVAXPrice()
      setPrice(data.price)
      setChange24h(data.change24h)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch AVAX price:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch price')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrice()
    const interval = setInterval(fetchPrice, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchPrice, refreshInterval])

  return {
    price,
    change24h,
    isLoading,
    error,
    refresh: fetchPrice
  }
}

// Hook for market summary
export function useMarketSummary() {
  const [marketData, setMarketData] = useState<MarketSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarketSummary = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getMarketSummary()
      
      // Ensure data is an array before mapping
      if (Array.isArray(data)) {
        setMarketData(data.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
        setError(null)
      } else {
        // Set empty array if data is not valid
        setMarketData([])
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch market summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch market data')
      // Set empty array on error
      setMarketData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMarketSummary()
  }, [fetchMarketSummary])

  return {
    marketData,
    isLoading,
    error,
    refresh: fetchMarketSummary
  }
}

// Combined hook for all market data
export function useMarketDashboard(refreshInterval: number = 300000) { // 5 minutes default
  const yields = useProtocolYields(refreshInterval)
  const avaxPrice = useAVAXPrice(refreshInterval)
  const marketSummary = useMarketSummary()

  const isLoading = yields.isLoading || avaxPrice.isLoading || marketSummary.isLoading
  const error = yields.error || avaxPrice.error || marketSummary.error

  const refreshAll = useCallback(async () => {
    await Promise.all([
      yields.refresh(),
      avaxPrice.refresh(),
      marketSummary.refresh()
    ])
  }, [yields, avaxPrice, marketSummary])

  // Calculate best yield opportunity
  const bestYield = yields.yields.reduce((best, current) => {
    if (!best || current.apy > best.apy) return current
    return best
  }, null as ProtocolYield | null)

  // Calculate average APY across protocols
  const averageAPY = yields.yields.length > 0
    ? yields.yields.reduce((sum, y) => sum + y.apy, 0) / yields.yields.length
    : 0

  return {
    yields: yields.yields,
    avaxPrice: avaxPrice.price,
    avaxChange24h: avaxPrice.change24h,
    marketSummary: marketSummary.marketData,
    bestYield,
    averageAPY,
    isLoading,
    error,
    refreshAll,
    lastUpdated: yields.lastUpdated
  }
}