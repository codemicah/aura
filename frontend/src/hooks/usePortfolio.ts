// Hooks for portfolio tracking and management
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { apiClient } from '@/utils/api'

export interface Portfolio {
  totalValue: string
  totalValueUSD: number
  allocation: {
    benqiAmount: string
    traderJoeAmount: string
    yieldYakAmount: string
    benqiPercentage: number
    traderJoePercentage: number
    yieldYakPercentage: number
  }
  estimatedAPY: number
  performance: {
    dailyReturn: number
    weeklyReturn: number
    monthlyReturn: number
    totalReturn: number
    totalReturnUSD: string
  }
  lastUpdated: Date
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdraw' | 'rebalance'
  amount: string
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
  gasUsed?: string
  gasPrice?: string
  blockNumber?: number
  timestamp: Date
}

export interface PortfolioHistory {
  date: string
  totalValue: number
  allocation: {
    benqi: number
    traderJoe: number
    yieldYak: number
  }
}

// Hook for portfolio data
export function usePortfolio() {
  const { address } = useAccount()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolio = useCallback(async () => {
    if (!address) {
      setPortfolio(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.getPortfolio(address)
      setPortfolio({
        ...data,
        totalValueUSD: parseFloat(data.totalValue) || 0,
        lastUpdated: new Date()
      })
    } catch (err) {
      console.error('Failed to fetch portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  return {
    portfolio,
    isLoading,
    error,
    refresh: fetchPortfolio
  }
}

// Hook for transaction history
export function useTransactionHistory(limit: number = 50) {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setTransactions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.getTransactions(address, limit)
      setTransactions(data.map(tx => ({
        ...tx,
        timestamp: new Date(tx.timestamp)
      })))
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setIsLoading(false)
    }
  }, [address, limit])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Auto-refresh pending transactions
  useEffect(() => {
    const hasPending = transactions.some(tx => tx.status === 'pending')
    if (hasPending) {
      const interval = setInterval(fetchTransactions, 5000) // Check every 5 seconds
      return () => clearInterval(interval)
    }
  }, [transactions, fetchTransactions])

  return {
    transactions,
    isLoading,
    error,
    refresh: fetchTransactions
  }
}

// Hook for portfolio history
export function usePortfolioHistory(days: number = 30) {
  const { address } = useAccount()
  const [history, setHistory] = useState<PortfolioHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!address) {
      setHistory([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.getPortfolioHistory(address, days)
      setHistory(data)
    } catch (err) {
      console.error('Failed to fetch portfolio history:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch history')
    } finally {
      setIsLoading(false)
    }
  }, [address, days])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    history,
    isLoading,
    error,
    refresh: fetchHistory
  }
}

// Hook for wallet balance
export function useWalletBalance() {
  const { address } = useAccount()
  const { data: balance, isLoading, error } = useBalance({
    address
  })

  return {
    balance: balance ? {
      value: balance.value,
      formatted: balance.formatted,
      symbol: balance.symbol,
      decimals: balance.decimals
    } : null,
    isLoading,
    error: error?.message || null
  }
}

// Combined portfolio dashboard hook
export function usePortfolioDashboard() {
  const portfolio = usePortfolio()
  const transactions = useTransactionHistory(10) // Last 10 transactions
  const history = usePortfolioHistory(7) // Last 7 days
  const walletBalance = useWalletBalance()

  const isLoading = 
    portfolio.isLoading || 
    transactions.isLoading || 
    history.isLoading || 
    walletBalance.isLoading

  const error = 
    portfolio.error || 
    transactions.error || 
    history.error || 
    walletBalance.error

  // Calculate portfolio metrics
  const metrics = {
    totalValueUSD: portfolio.portfolio?.totalValueUSD || 0,
    totalReturnUSD: parseFloat(portfolio.portfolio?.performance?.totalReturnUSD || '0'),
    dailyReturn: portfolio.portfolio?.performance?.dailyReturn || 0,
    weeklyReturn: portfolio.portfolio?.performance?.weeklyReturn || 0,
    monthlyReturn: portfolio.portfolio?.performance?.monthlyReturn || 0,
    estimatedAPY: portfolio.portfolio?.estimatedAPY || 0,
    walletBalance: walletBalance.balance?.formatted || '0',
    pendingTransactions: transactions.transactions.filter(tx => tx.status === 'pending').length
  }

  // Calculate allocation percentages for chart
  const allocationData = portfolio.portfolio ? [
    { name: 'Benqi', value: portfolio.portfolio.allocation.benqiPercentage, color: '#4F46E5' },
    { name: 'TraderJoe', value: portfolio.portfolio.allocation.traderJoePercentage, color: '#EC4899' },
    { name: 'YieldYak', value: portfolio.portfolio.allocation.yieldYakPercentage, color: '#10B981' }
  ] : []

  return {
    portfolio: portfolio.portfolio,
    transactions: transactions.transactions,
    history: history.history,
    walletBalance: walletBalance.balance,
    metrics,
    allocationData,
    isLoading,
    error,
    refresh: async () => {
      await Promise.all([
        portfolio.refresh(),
        transactions.refresh(),
        history.refresh()
      ])
    }
  }
}