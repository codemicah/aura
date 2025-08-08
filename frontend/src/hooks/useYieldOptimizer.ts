'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, useBlockNumber } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { YIELD_OPTIMIZER_ABI, getYieldOptimizerAddress } from '../config/contracts'
import type { TransactionStep } from '../components/TransactionStatus'

export function useYieldOptimizer() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = getYieldOptimizerAddress(chainId)
  const { data: blockNumber } = useBlockNumber({ watch: true })

  // Enhanced transaction state management
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())

  // Read functions
  const { data: userPortfolio, isLoading: isLoadingPortfolio, refetch: refetchPortfolio } = useReadContract({
    address: contractAddress,
    abi: YIELD_OPTIMIZER_ABI,
    functionName: 'getUserPortfolio',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  })

  const { data: currentYields, isLoading: isLoadingYields, refetch: refetchYields } = useReadContract({
    address: contractAddress,
    abi: YIELD_OPTIMIZER_ABI,
    functionName: 'getCurrentYields',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  })

  const { data: rebalanceRecommendation, isLoading: isLoadingRebalance } = useReadContract({
    address: contractAddress,
    abi: YIELD_OPTIMIZER_ABI,
    functionName: 'getRebalanceRecommendation',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 60000, // Refetch every minute
    }
  })

  // Write functions
  const { writeContract: optimizeYield, data: optimizeHash, error: optimizeError, isPending: isOptimizing } = useWriteContract()
  const { writeContract: rebalancePortfolio, data: rebalanceHash, error: rebalanceError, isPending: isRebalancing } = useWriteContract()
  const { writeContract: emergencyWithdraw, data: withdrawHash, error: withdrawError, isPending: isWithdrawing } = useWriteContract()

  // Transaction status
  const { isLoading: isOptimizeConfirming, isSuccess: isOptimizeSuccess } = useWaitForTransactionReceipt({
    hash: optimizeHash,
  })

  const { isLoading: isRebalanceConfirming, isSuccess: isRebalanceSuccess } = useWaitForTransactionReceipt({
    hash: rebalanceHash,
  })

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  // Enhanced transaction monitoring
  useEffect(() => {
    if (blockNumber) {
      setLastRefreshTime(new Date())
      // Force data refetch on new blocks for real-time updates
      refetchPortfolio()
      refetchYields()
    }
  }, [blockNumber, refetchPortfolio, refetchYields])

  // Transaction step management
  const initializeTransactionSteps = (type: 'invest' | 'rebalance' | 'withdraw') => {
    const baseSteps = [
      { id: 'confirm', label: 'Confirm transaction', status: 'active' as const, description: 'Please confirm the transaction in your wallet' },
      { id: 'pending', label: 'Processing transaction', status: 'pending' as const, description: 'Waiting for blockchain confirmation' },
      { id: 'success', label: 'Transaction completed', status: 'pending' as const, description: 'Your portfolio has been updated' }
    ]

    const typeSpecificDescriptions = {
      invest: 'Your investment is being allocated across DeFi protocols',
      rebalance: 'Your portfolio is being rebalanced for optimal yields',
      withdraw: 'Your funds are being withdrawn from all positions'
    }

    baseSteps[2].description = typeSpecificDescriptions[type]
    setTransactionSteps(baseSteps)
    setIsTransactionModalOpen(true)
  }

  const updateTransactionStep = (stepId: string, updates: Partial<TransactionStep>) => {
    setTransactionSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    )
  }

  const advanceToNextStep = (currentStepId: string) => {
    setTransactionSteps(prev => {
      const currentIndex = prev.findIndex(step => step.id === currentStepId)
      return prev.map((step, index) => {
        if (index === currentIndex) {
          return { ...step, status: 'completed' as const }
        } else if (index === currentIndex + 1) {
          return { ...step, status: 'active' as const }
        }
        return step
      })
    })
  }

  // Enhanced helper functions with transaction tracking
  const invest = async (amount: string, riskScore: number) => {
    if (!contractAddress) throw new Error('Contract not available on this network')
    
    try {
      initializeTransactionSteps('invest')
      
      await optimizeYield({
        address: contractAddress,
        abi: YIELD_OPTIMIZER_ABI,
        functionName: 'optimizeYield',
        args: [riskScore],
        value: parseEther(amount),
      })
    } catch (error) {
      updateTransactionStep('confirm', { 
        status: 'error', 
        description: 'Transaction was rejected or failed' 
      })
      throw error
    }
  }

  const rebalance = async () => {
    if (!contractAddress) throw new Error('Contract not available on this network')
    
    try {
      initializeTransactionSteps('rebalance')
      
      await rebalancePortfolio({
        address: contractAddress,
        abi: YIELD_OPTIMIZER_ABI,
        functionName: 'rebalance',
      })
    } catch (error) {
      updateTransactionStep('confirm', { 
        status: 'error', 
        description: 'Transaction was rejected or failed' 
      })
      throw error
    }
  }

  const withdraw = async () => {
    if (!contractAddress) throw new Error('Contract not available on this network')
    
    try {
      initializeTransactionSteps('withdraw')
      
      await emergencyWithdraw({
        address: contractAddress,
        abi: YIELD_OPTIMIZER_ABI,
        functionName: 'emergencyWithdraw',
      })
    } catch (error) {
      updateTransactionStep('confirm', { 
        status: 'error', 
        description: 'Transaction was rejected or failed' 
      })
      throw error
    }
  }

  // Formatted data helpers
  const formatPortfolioData = () => {
    if (!userPortfolio) return null

    const [profile, allocation, estimatedValue] = userPortfolio
    
    return {
      profile: {
        riskScore: profile.riskScore,
        totalDeposited: formatEther(profile.totalDeposited),
        lastRebalance: new Date(Number(profile.lastRebalance) * 1000),
        autoRebalance: profile.autoRebalance,
      },
      allocation: {
        benqiAmount: formatEther(allocation.benqiAmount),
        traderJoeAmount: formatEther(allocation.traderJoeAmount),
        yieldYakAmount: formatEther(allocation.yieldYakAmount),
      },
      estimatedValue: formatEther(estimatedValue),
      totalValue: formatEther(allocation.benqiAmount + allocation.traderJoeAmount + allocation.yieldYakAmount),
    }
  }

  const formatYieldsData = () => {
    if (!currentYields) return null

    const [benqiAPY, traderJoeAPY, yieldYakAPY, lastUpdated] = currentYields
    
    return {
      benqi: Number(benqiAPY) / 100, // Convert from basis points to percentage
      traderJoe: Number(traderJoeAPY) / 100,
      yieldYak: Number(yieldYakAPY) / 100,
      lastUpdated: new Date(Number(lastUpdated) * 1000),
    }
  }

  const formatRebalanceData = () => {
    if (!rebalanceRecommendation) return null

    const [shouldRebalance, newBenqi, newTraderJoe, newYieldYak] = rebalanceRecommendation
    
    return {
      shouldRebalance,
      newAllocation: {
        benqi: formatEther(newBenqi),
        traderJoe: formatEther(newTraderJoe),
        yieldYak: formatEther(newYieldYak),
      }
    }
  }

  // Transaction monitoring effects
  useEffect(() => {
    if (optimizeHash) {
      advanceToNextStep('confirm')
      updateTransactionStep('pending', { 
        hash: optimizeHash,
        description: 'Investment transaction is being processed on the blockchain'
      })
    }
  }, [optimizeHash])

  useEffect(() => {
    if (rebalanceHash) {
      advanceToNextStep('confirm')
      updateTransactionStep('pending', { 
        hash: rebalanceHash,
        description: 'Rebalance transaction is being processed on the blockchain'
      })
    }
  }, [rebalanceHash])

  useEffect(() => {
    if (withdrawHash) {
      advanceToNextStep('confirm')
      updateTransactionStep('pending', { 
        hash: withdrawHash,
        description: 'Withdrawal transaction is being processed on the blockchain'
      })
    }
  }, [withdrawHash])

  useEffect(() => {
    if (isOptimizeSuccess || isRebalanceSuccess || isWithdrawSuccess) {
      advanceToNextStep('pending')
      setTimeout(() => {
        refetchPortfolio()
        refetchYields()
      }, 1000)
    }
  }, [isOptimizeSuccess, isRebalanceSuccess, isWithdrawSuccess, refetchPortfolio, refetchYields])

  // Enhanced portfolio metrics
  const getPortfolioMetrics = () => {
    const portfolio = formatPortfolioData()
    if (!portfolio) return null

    const totalValue = parseFloat(portfolio.totalValue)
    const totalDeposited = parseFloat(portfolio.profile.totalDeposited)
    const totalEarnings = totalValue - totalDeposited
    const returnPercentage = totalDeposited > 0 ? (totalEarnings / totalDeposited) * 100 : 0

    return {
      totalValue,
      totalDeposited,
      totalEarnings,
      returnPercentage: Math.max(0, returnPercentage),
      daysSinceLastRebalance: Math.floor((Date.now() - portfolio.profile.lastRebalance.getTime()) / (1000 * 60 * 60 * 24)),
    }
  }

  return {
    // Read data
    portfolio: formatPortfolioData(),
    yields: formatYieldsData(),
    rebalanceRec: formatRebalanceData(),
    portfolioMetrics: getPortfolioMetrics(),
    
    // Loading states
    isLoadingPortfolio,
    isLoadingYields,
    isLoadingRebalance,
    
    // Write functions
    invest,
    rebalance,
    withdraw,
    
    // Transaction states
    isOptimizing,
    isOptimizeConfirming,
    isOptimizeSuccess,
    optimizeError,
    
    isRebalancing,
    isRebalanceConfirming,
    isRebalanceSuccess,
    rebalanceError,
    
    isWithdrawing,
    isWithdrawConfirming,
    isWithdrawSuccess,
    withdrawError,
    
    // Enhanced transaction tracking
    transactionSteps,
    isTransactionModalOpen,
    closeTransactionModal: () => setIsTransactionModalOpen(false),
    
    // Refetch functions
    refetchPortfolio,
    refetchYields,
    
    // Real-time data
    lastRefreshTime,
    currentBlock: blockNumber,
    
    // Contract info
    contractAddress,
    isContractAvailable: !!contractAddress,
  }
}