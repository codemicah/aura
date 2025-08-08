// Core Types for Personal DeFi Wealth Manager Backend

export interface UserProfile {
  id: string
  address: string
  riskScore: number
  riskProfile: 'Conservative' | 'Balanced' | 'Aggressive'
  totalDeposited: string
  lastRebalance: Date
  autoRebalance: boolean
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  maxSlippage: number
  minYieldThreshold: number
  rebalanceFrequency: number // days
  excludedProtocols: string[]
  notificationSettings: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  rebalanceAlerts: boolean
  yieldThresholdAlerts: boolean
  portfolioUpdates: boolean
}

export interface Portfolio {
  userId: string
  totalValue: string
  allocation: AllocationData
  estimatedAPY: number
  lastUpdated: Date
  performance: PerformanceData
}

export interface AllocationData {
  benqiAmount: string
  traderJoeAmount: string
  yieldYakAmount: string
  benqiPercentage: number
  traderJoePercentage: number
  yieldYakPercentage: number
}

export interface PerformanceData {
  dailyReturn: number
  weeklyReturn: number
  monthlyReturn: number
  totalReturn: number
  totalReturnUSD: string
}

export interface YieldData {
  protocol: 'benqi' | 'traderjoe' | 'yieldyak'
  apy: number
  tvl: string
  lastUpdated: Date
  isActive: boolean
}

export interface RebalanceRecommendation {
  userId: string
  currentAllocation: AllocationData
  recommendedAllocation: AllocationData
  reason: string
  expectedImprovementAPY: number
  confidence: number
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: 'deposit' | 'withdraw' | 'rebalance'
  amount: string
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
  gasUsed?: string
  gasPrice?: string
  blockNumber?: number
  timestamp: Date
}

export interface AIRecommendation {
  userId: string
  type: 'rebalance' | 'deposit' | 'withdraw' | 'yield_opportunity'
  title: string
  description: string
  confidence: number
  expectedReturn?: number
  riskLevel: 'low' | 'medium' | 'high'
  actionData?: Record<string, any>
  createdAt: Date
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

export interface ChainConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  contracts: {
    yieldOptimizer: string
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Request Types
export interface CreateUserRequest {
  address: string
  riskScore: number
  preferences?: Partial<UserPreferences>
}

export interface UpdateUserRequest {
  riskScore?: number
  preferences?: Partial<UserPreferences>
}

export interface RebalanceRequest {
  userId: string
  force?: boolean
}

export interface DepositRequest {
  userId: string
  amount: string
  riskScore: number
}

// Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}