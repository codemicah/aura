// Custom hooks for AI integration
import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { apiClient } from '@/utils/api'
import { 
  RiskAssessmentAnswers, 
  AllocationStrategy, 
  AIRecommendation,
  SurplusCalculation 
} from '@/types/ai'

// Hook for risk assessment and scoring
export function useRiskAssessment() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [riskProfile, setRiskProfile] = useState<'Conservative' | 'Balanced' | 'Aggressive' | null>(null)

  const calculateRiskScore = useCallback(async (answers: RiskAssessmentAnswers) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiClient.calculateRiskScore(answers)
      setRiskScore(result.riskScore)
      setRiskProfile(result.riskProfile)
      
      // Save to backend if wallet is connected
      if (address) {
        await apiClient.saveUserProfile(address, {
          riskScore: result.riskScore,
          riskProfile: result.riskProfile,
          age: answers.age,
          income: answers.income,
          expenses: answers.monthlyExpenses,
          goals: answers.investmentGoal,
          riskTolerance: answers.riskTolerance
        })
      }
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate risk score'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address])

  // Load from backend on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (address) {
        setIsLoading(true)
        try {
          // Load from backend only
          const profile = await apiClient.getUserProfile(address)
          if (profile) {
            setRiskScore(profile.riskScore)
            setRiskProfile(profile.riskProfile)
          }
        } catch (err) {
          console.error('Failed to load profile from backend:', err)
          setError('Failed to load risk profile')
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    loadProfile()
  }, [address])

  return {
    riskScore,
    riskProfile,
    isLoading,
    error,
    calculateRiskScore,
  }
}

// Hook for allocation strategy
export function useAllocationStrategy(riskScore: number | null) {
  const [allocation, setAllocation] = useState<AllocationStrategy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateAllocation = useCallback(async (score?: number) => {
    const targetScore = score || riskScore
    if (!targetScore) {
      setError('Risk score required')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.generateAllocation(targetScore)
      setAllocation(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate allocation'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [riskScore])

  // Auto-generate when risk score changes
  useEffect(() => {
    if (riskScore && !allocation) {
      generateAllocation()
    }
  }, [riskScore, allocation, generateAllocation])

  return {
    allocation,
    isLoading,
    error,
    generateAllocation,
    refreshAllocation: () => generateAllocation(),
  }
}

// Hook for investment recommendations
export function useAIRecommendations() {
  const { address } = useAccount()
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRecommendation = useCallback(async (
    portfolioValue?: number,
    monthlyIncome?: number,
    monthlyExpenses?: number
  ) => {
    if (!address) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.getRecommendation({
        address,
        portfolioValue,
        monthlyIncome,
        monthlyExpenses,
      })
      
      const recommendation: AIRecommendation = {
        ...result,
        createdAt: new Date(),
      }
      
      setRecommendation(recommendation)
      return recommendation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get recommendation'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address])

  return {
    recommendation,
    isLoading,
    error,
    getRecommendation,
  }
}

// Hook for surplus calculation
export function useSurplusCalculator() {
  const [surplus, setSurplus] = useState<SurplusCalculation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateSurplus = useCallback(async (data: {
    monthlyIncome: number
    monthlyExpenses: number
    emergencyFundTarget?: number
    currentEmergencyFund?: number
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.calculateSurplus(data)
      setSurplus(result)
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate surplus'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])


  return {
    surplus,
    isLoading,
    error,
    calculateSurplus,
  }
}

// Hook for portfolio analysis
export function usePortfolioAnalysis() {
  const { address } = useAccount()
  const [analysis, setAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzePortfolio = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.analyzePortfolio(address)
      setAnalysis(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze portfolio'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address])

  // Auto-analyze on address change
  useEffect(() => {
    if (address) {
      analyzePortfolio()
    }
  }, [address, analyzePortfolio])

  return {
    analysis,
    isLoading,
    error,
    analyzePortfolio,
    refreshAnalysis: analyzePortfolio,
  }
}

// Combined hook for complete AI flow
export function useAIFlow() {
  const riskAssessment = useRiskAssessment()
  const allocation = useAllocationStrategy(riskAssessment.riskScore)
  const recommendations = useAIRecommendations()
  const surplus = useSurplusCalculator()
  const portfolio = usePortfolioAnalysis()

  const isLoading = 
    riskAssessment.isLoading ||
    allocation.isLoading ||
    recommendations.isLoading ||
    surplus.isLoading ||
    portfolio.isLoading

  const error = 
    riskAssessment.error ||
    allocation.error ||
    recommendations.error ||
    surplus.error ||
    portfolio.error

  return {
    riskAssessment,
    allocation,
    recommendations,
    surplus,
    portfolio,
    isLoading,
    error,
  }
}