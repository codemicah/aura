'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { useYieldOptimizer } from '../hooks/useYieldOptimizer'
import { TransactionStatus } from './TransactionStatus'
import { useNotificationHelpers } from './NotificationSystem'
import { CONTRACT_CONSTANTS } from '../config/contracts'

interface InvestmentFormProps {
  className?: string
}

export function InvestmentForm({ className = '' }: InvestmentFormProps) {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading: isLoadingBalance } = useBalance({
    address,
  })
  const { 
    invest, 
    rebalance, 
    withdraw,
    isOptimizing, 
    isOptimizeConfirming, 
    isOptimizeSuccess,
    isRebalancing,
    isRebalanceConfirming,
    isRebalanceSuccess,
    isWithdrawing,
    isWithdrawConfirming,
    isWithdrawSuccess,
    optimizeError,
    rebalanceError,
    withdrawError,
    refetchPortfolio,
    isContractAvailable,
    transactionSteps,
    isTransactionModalOpen,
    closeTransactionModal,
    portfolioMetrics,
    lastRefreshTime
  } = useYieldOptimizer()

  const [amount, setAmount] = useState('')
  const [riskScore, setRiskScore] = useState(50)
  const [showSuccess, setShowSuccess] = useState(false)

  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotificationHelpers()

  // Load risk profile from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('riskProfile')
      if (stored) {
        const profile = JSON.parse(stored)
        setRiskScore(profile.riskScore)
      }
    }
  }, [])

  // Handle success states
  useEffect(() => {
    if (isOptimizeSuccess) {
      setShowSuccess(true)
      setAmount('')
      refetchPortfolio()
      notifySuccess(
        'Investment Successful!',
        'Your funds have been invested and allocated across DeFi protocols.',
        {
          label: 'View Portfolio',
          onClick: () => window.location.reload()
        }
      )
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isOptimizeSuccess, refetchPortfolio, notifySuccess])

  useEffect(() => {
    if (isRebalanceSuccess) {
      refetchPortfolio()
      notifySuccess(
        'Rebalance Complete!',
        'Your portfolio has been successfully rebalanced for optimal yields.'
      )
    }
  }, [isRebalanceSuccess, refetchPortfolio, notifySuccess])

  useEffect(() => {
    if (isWithdrawSuccess) {
      refetchPortfolio()
      notifySuccess(
        'Withdrawal Complete!',
        'Your funds have been successfully withdrawn from all positions.'
      )
    }
  }, [isWithdrawSuccess, refetchPortfolio, notifySuccess])

  const handleInvest = async () => {
    if (!amount || parseFloat(amount) < parseFloat(CONTRACT_CONSTANTS.MIN_DEPOSIT)) {
      notifyWarning(
        'Invalid Amount',
        `Minimum investment is ${CONTRACT_CONSTANTS.MIN_DEPOSIT} AVAX`,
      )
      return
    }

    // Check if user has enough balance
    if (balance && parseFloat(amount) > parseFloat(balance.formatted)) {
      notifyError('Insufficient Balance', 'You don\'t have enough AVAX for this investment.')
      return
    }

    try {
      await invest(amount, riskScore)
      notifyInfo('Transaction Started', 'Your investment transaction has been initiated. Please check your wallet.')
    } catch (error) {
      console.error('Investment failed:', error)
      notifyError(
        'Investment Failed', 
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }

  const handleRebalance = async () => {
    try {
      await rebalance()
      notifyInfo('Rebalance Started', 'Portfolio rebalancing has been initiated.')
    } catch (error) {
      console.error('Rebalance failed:', error)
      notifyError(
        'Rebalance Failed',
        error instanceof Error ? error.message : 'Failed to rebalance portfolio'
      )
    }
  }

  const handleWithdraw = async () => {
    if (window.confirm('Are you sure you want to withdraw all funds? This will close all your positions.')) {
      try {
        await withdraw()
        notifyWarning('Withdrawal Started', 'Emergency withdrawal has been initiated. All positions will be closed.')
      } catch (error) {
        console.error('Withdrawal failed:', error)
        notifyError(
          'Withdrawal Failed',
          error instanceof Error ? error.message : 'Failed to withdraw funds'
        )
      }
    }
  }

  const formatBalance = () => {
    if (!balance) return '0.00'
    return parseFloat(balance.formatted).toFixed(4)
  }

  const getRiskLevelName = (score: number) => {
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.CONSERVATIVE.max) return 'Conservative'
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.BALANCED.max) return 'Balanced'
    return 'Aggressive'
  }

  const getRiskLevelColor = (score: number) => {
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.CONSERVATIVE.max) return 'text-green-600'
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.BALANCED.max) return 'text-blue-600'
    return 'text-purple-600'
  }

  const setMaxAmount = () => {
    if (balance) {
      // Reserve 0.001 AVAX for gas
      const maxAmount = Math.max(0, parseFloat(balance.formatted) - 0.001)
      setAmount(maxAmount.toFixed(6))
    }
  }

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-gray-600 text-sm">Connect your wallet to start investing</p>
        </div>
      </div>
    )
  }

  if (!isContractAvailable) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-sm font-medium mb-1">Contract Not Available</p>
          <p className="text-gray-600 text-sm">Switch to Avalanche or Fuji testnet</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Transaction Status Modal */}
      <TransactionStatus
        steps={transactionSteps}
        isOpen={isTransactionModalOpen}
        onClose={closeTransactionModal}
        title="Processing Transaction"
      />

      <div className={`space-y-6 ${className}`}>
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">Transaction successful!</span>
          </div>
        </div>
      )}

      {/* Quick Invest */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Invest</h3>
        
        {/* Balance Display with Real-time Indicator */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Available Balance</span>
            <div className="text-right">
              {isLoadingBalance ? (
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {formatBalance()} AVAX
                </span>
              )}
            </div>
          </div>
          {lastRefreshTime && (
            <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (AVAX)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min={CONTRACT_CONSTANTS.MIN_DEPOSIT}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-16"
                disabled={isOptimizing || isOptimizeConfirming}
              />
              <button
                onClick={setMaxAmount}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                disabled={isLoadingBalance || isOptimizing || isOptimizeConfirming}
              >
                MAX
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Minimum: {CONTRACT_CONSTANTS.MIN_DEPOSIT} AVAX
            </div>
          </div>

          {/* Risk Level Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Profile
            </label>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className={`font-medium ${getRiskLevelColor(riskScore)}`}>
                {getRiskLevelName(riskScore)}
              </span>
              <span className="text-sm text-gray-600">Score: {riskScore}/100</span>
            </div>
          </div>

          {/* Invest Button */}
          <button
            onClick={handleInvest}
            disabled={
              !amount || 
              parseFloat(amount) < parseFloat(CONTRACT_CONSTANTS.MIN_DEPOSIT) ||
              isOptimizing || 
              isOptimizeConfirming ||
              isLoadingBalance
            }
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isOptimizing || isOptimizeConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isOptimizing ? 'Confirming...' : 'Processing...'}
              </>
            ) : (
              'Invest Now'
            )}
          </button>

          {/* Error Display */}
          {optimizeError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
              {optimizeError.message || 'Transaction failed'}
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Actions</h3>
        
        <div className="space-y-3">
          {/* Rebalance Button */}
          <button
            onClick={handleRebalance}
            disabled={isRebalancing || isRebalanceConfirming}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRebalancing || isRebalanceConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isRebalancing ? 'Confirming...' : 'Rebalancing...'}
              </>
            ) : (
              'Rebalance Portfolio'
            )}
          </button>

          {/* Emergency Withdraw Button */}
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || isWithdrawConfirming}
            className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isWithdrawing || isWithdrawConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                {isWithdrawing ? 'Confirming...' : 'Withdrawing...'}
              </>
            ) : (
              'Emergency Withdraw'
            )}
          </button>

          {/* Error Display for Portfolio Actions */}
          {(rebalanceError || withdrawError) && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
              {rebalanceError?.message || withdrawError?.message || 'Transaction failed'}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}