// API Client for Backend Integration
import { RiskAssessmentAnswers, AllocationStrategy } from '@/types/ai'
import { Portfolio, MarketData, Transaction } from '@/types'

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
    type: 'rebalance' | 'deposit' | 'withdraw' | 'yield_opportunity'
    title: string
    description: string
    confidence: number
    expectedReturn?: number
    riskLevel: 'low' | 'medium' | 'high'
    actionData?: any
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
    return this.request(`/portfolio/${address}/transactions?limit=${limit}`)
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