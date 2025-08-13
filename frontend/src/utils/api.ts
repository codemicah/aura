// API Client for Backend Integration
import { RiskAssessmentAnswers, AllocationStrategy } from '@/types/ai'

// Type definitions
export interface Portfolio {
  totalValue: string
  allocation: any
  estimatedAPY: number
  lastUpdated: Date
  performance: any
}

export interface MarketData {
  protocol: string
  apy: number
  tvl: string
  volume24h: string
  fees24h: string
  utilization: number
  timestamp: Date
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

class APIClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error)
      throw error
    }
  }

  // AI Endpoints
  async calculateRiskScore(answers: RiskAssessmentAnswers): Promise<{
    riskScore: number
    riskProfile: 'Conservative' | 'Balanced' | 'Aggressive'
  }> {
    return this.request('/ai/risk-score', {
      method: 'POST',
      body: JSON.stringify(answers),
    })
  }

  async generateAllocation(riskScore: number): Promise<AllocationStrategy> {
    return this.request('/ai/allocation', {
      method: 'POST',
      body: JSON.stringify({ riskScore }),
    })
  }

  async calculateSurplus(data: {
    monthlyIncome: number
    monthlyExpenses: number
    emergencyFundTarget?: number
    currentEmergencyFund?: number
  }): Promise<{
    monthlySurplus: number
    emergencyFundNeeded: number
    investableAmount: number
    recommendedInvestmentPercentage: number
  }> {
    return this.request('/ai/surplus', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRecommendation(data: {
    address: string
    portfolioValue?: number
    monthlyIncome?: number
    monthlyExpenses?: number
  }): Promise<{
    recommendation: {
      type: 'rebalance' | 'deposit' | 'withdraw' | 'yield_opportunity'
      title: string
      description: string
      confidence: number
      expectedReturn?: number
      riskLevel: 'low' | 'medium' | 'high'
      actionData?: any
    }
    userProfile: {
      riskScore: number
      riskProfile: string
      lastRebalance: Date
    }
  }> {
    return this.request('/ai/recommendation', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRiskProfiles(): Promise<Array<{
    name: string
    range: string
    description: string
    allocation: {
      benqi: number
      traderJoe: number
      yieldYak: number
    }
  }>> {
    return this.request('/ai/risk-profiles')
  }

  async analyzePortfolio(address: string): Promise<{
    performance: {
      dailyReturn: number
      weeklyReturn: number
      monthlyReturn: number
      totalReturn: number
    }
    suggestions: string[]
    riskAnalysis: {
      currentRisk: number
      optimalRisk: number
      adjustmentNeeded: boolean
    }
  }> {
    return this.request('/ai/analyze-portfolio', {
      method: 'POST',
      body: JSON.stringify({ address }),
    })
  }

  // Portfolio Endpoints
  async getPortfolio(address: string): Promise<Portfolio> {
    return this.request(`/portfolio/${address}`)
  }

  async getPortfolioHistory(
    address: string,
    days: number = 30
  ): Promise<Array<{
    date: string
    totalValue: number
    allocation: {
      benqi: number
      traderJoe: number
      yieldYak: number
    }
  }>> {
    return this.request(`/portfolio/${address}/history?days=${days}`)
  }

  async getTransactions(
    address: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    const response = await this.request<{ transactions: Transaction[] }>(
      `/portfolio/${address}/transactions?limit=${limit}`
    )
    return response.transactions || []
  }

  async saveTransaction(
    address: string,
    transaction: {
      type: 'deposit' | 'withdraw' | 'rebalance'
      amount: string
      hash: string
      status?: 'pending' | 'confirmed' | 'failed'
      gasUsed?: string
      gasPrice?: string
      blockNumber?: number
    }
  ): Promise<any> {
    return this.request(`/portfolio/${address}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    })
  }

  async getUserProfile(address: string): Promise<{
    riskScore: number
    riskProfile: 'Conservative' | 'Balanced' | 'Aggressive'
    preferences?: any
  } | null> {
    const response = await this.request<any>(`/portfolio/${address}/profile`)
    return response.message ? null : response
  }

  async saveUserProfile(
    address: string,
    data: {
      riskScore: number
      riskProfile: 'Conservative' | 'Balanced' | 'Aggressive'
      age?: number
      income?: number
      expenses?: number
      goals?: string
      riskTolerance?: string
      preferences?: any
    }
  ): Promise<any> {
    return this.request(`/portfolio/${address}/profile`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Market Data Endpoints
  async getMarketSummary(): Promise<MarketData[]> {
    return this.request('/market/summary')
  }

  async getProtocolYields(): Promise<Array<{
    protocol: string
    apy: number
    tvl: string
    isActive: boolean
  }>> {
    return this.request('/market/yields')
  }

  async getAVAXPrice(): Promise<{
    price: number
    change24h: number
  }> {
    return this.request('/market/avax-price')
  }

  // Health Check
  async healthCheck(): Promise<{
    status: string
    services: {
      database: boolean
      blockchain: boolean
      ai: boolean
    }
  }> {
    return this.request('/health')
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export types for convenience
export type { RiskAssessmentAnswers, AllocationStrategy }