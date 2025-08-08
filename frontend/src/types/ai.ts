// AI-related types for the frontend

export interface RiskAssessmentAnswers {
  age: number
  income: number
  monthlyExpenses: number
  investmentGoal: 'short_term' | 'medium_term' | 'long_term' | 'retirement'
  riskTolerance: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  investmentExperience: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  timeHorizon: number // in years
  liquidityNeed: 'high' | 'medium' | 'low'
}

export interface AllocationStrategy {
  benqi: number    // Percentage (0-100)
  traderJoe: number
  yieldYak: number
  rationale: string
  expectedAPY: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface AIRecommendation {
  type: 'rebalance' | 'deposit' | 'withdraw' | 'yield_opportunity'
  title: string
  description: string
  confidence: number
  expectedReturn?: number
  riskLevel: 'low' | 'medium' | 'high'
  actionData?: {
    allocation?: AllocationStrategy
    surplusData?: SurplusCalculation
    marketData?: Array<{
      protocol: string
      apy: number
      isActive: boolean
    }>
  }
  createdAt: Date
}

export interface SurplusCalculation {
  monthlySurplus: number
  emergencyFundNeeded: number
  investableAmount: number
  recommendedInvestmentPercentage: number
}

export interface RiskProfile {
  name: 'Conservative' | 'Balanced' | 'Aggressive'
  scoreRange: {
    min: number
    max: number
  }
  description: string
  characteristics: string[]
  defaultAllocation: {
    benqi: number
    traderJoe: number
    yieldYak: number
  }
  expectedAPY: {
    min: number
    max: number
  }
}

export interface PortfolioAnalysis {
  performance: {
    dailyReturn: number
    weeklyReturn: number
    monthlyReturn: number
    totalReturn: number
    totalReturnUSD: string
  }
  riskMetrics: {
    currentRiskScore: number
    volatility: number
    sharpeRatio?: number
  }
  allocation: {
    current: AllocationStrategy
    recommended: AllocationStrategy
    deviationPercentage: number
  }
  suggestions: string[]
  rebalanceNeeded: boolean
  lastRebalance: Date
}