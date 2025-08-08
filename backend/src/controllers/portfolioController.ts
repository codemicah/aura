import { Request, Response, NextFunction } from 'express'
import { blockchainService } from '../services/blockchain'
import { defiDataService } from '../services/defi'
import { logger } from '../utils/logger'
import { ApiResponse, APIError, ValidationError } from '../types'

export class PortfolioController {
  /**
   * Get user portfolio data from blockchain
   */
  async getUserPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const chainId = parseInt(req.query.chainId as string) || 43114

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError('Invalid Ethereum address', 'address')
      }

      logger.info('Fetching user portfolio', { 
        address: address.slice(0, 8) + '...', 
        chainId 
      })

      // Check if contract is deployed for this chain
      if (!blockchainService.hasContract(chainId)) {
        const response: ApiResponse = {
          success: false,
          error: `YieldOptimizer contract not deployed on chain ${chainId}. Please deploy the contract first or switch to a supported network.`,
          timestamp: new Date()
        }
        res.status(503).json(response)
        return
      }

      // Fetch portfolio data from blockchain
      const portfolio = await blockchainService.getUserPortfolio(address, chainId)
      
      // Get current market data to calculate USD values
      const avaxPrice = await defiDataService.getAVAXPrice()
      
      // Calculate USD values
      const totalValueUSD = parseFloat(portfolio.estimatedValue) * avaxPrice
      const totalDepositedUSD = parseFloat(portfolio.profile.totalDeposited) * avaxPrice

      const response: ApiResponse = {
        success: true,
        data: {
          ...portfolio,
          metrics: {
            totalValueUSD: totalValueUSD.toFixed(2),
            totalDepositedUSD: totalDepositedUSD.toFixed(2),
            totalEarningsUSD: (totalValueUSD - totalDepositedUSD).toFixed(2),
            returnPercentage: totalDepositedUSD > 0 
              ? (((totalValueUSD - totalDepositedUSD) / totalDepositedUSD) * 100).toFixed(2)
              : '0.00',
            avaxPrice
          }
        },
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user balance from blockchain
   */
  async getUserBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const chainId = parseInt(req.query.chainId as string) || 43114

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError('Invalid Ethereum address', 'address')
      }

      const balance = await blockchainService.getBalance(address, chainId)
      const avaxPrice = await defiDataService.getAVAXPrice()
      const balanceUSD = parseFloat(balance) * avaxPrice

      const response: ApiResponse = {
        success: true,
        data: {
          balance,
          balanceUSD: balanceUSD.toFixed(2),
          avaxPrice
        },
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get rebalance recommendation for user
   */
  async getRebalanceRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const chainId = parseInt(req.query.chainId as string) || 43114

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError('Invalid Ethereum address', 'address')
      }

      // Get recommendation from smart contract
      const recommendation = await blockchainService.getRebalanceRecommendation(address, chainId)
      
      // Get current yields to explain the recommendation
      const currentYields = await blockchainService.getCurrentYields(chainId)
      
      // Calculate potential improvement
      const currentPortfolio = await blockchainService.getUserPortfolio(address, chainId)
      const currentAllocation = currentPortfolio.allocation
      
      // Simple weighted average APY calculation
      const currentAPY = (
        (parseFloat(currentAllocation.benqiAmount) * currentYields.benqi) +
        (parseFloat(currentAllocation.traderJoeAmount) * currentYields.traderJoe) +
        (parseFloat(currentAllocation.yieldYakAmount) * currentYields.yieldYak)
      ) / parseFloat(currentPortfolio.estimatedValue)

      const newAPY = (
        (parseFloat(recommendation.newAllocation.benqi) * currentYields.benqi) +
        (parseFloat(recommendation.newAllocation.traderJoe) * currentYields.traderJoe) +
        (parseFloat(recommendation.newAllocation.yieldYak) * currentYields.yieldYak)
      ) / parseFloat(currentPortfolio.estimatedValue)

      const response: ApiResponse = {
        success: true,
        data: {
          ...recommendation,
          currentYields,
          projectedImprovement: {
            currentAPY: currentAPY.toFixed(2),
            newAPY: newAPY.toFixed(2),
            improvementAPY: (newAPY - currentAPY).toFixed(2),
            reason: recommendation.shouldRebalance 
              ? 'Market conditions favor rebalancing for higher yields'
              : 'Current allocation is already optimal'
          }
        },
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { hash } = req.params
      const chainId = parseInt(req.query.chainId as string) || 43114

      if (!hash || hash.length !== 66 || !hash.startsWith('0x')) {
        throw new ValidationError('Invalid transaction hash format', 'hash')
      }

      const receipt = await blockchainService.getTransactionReceipt(hash, chainId)
      
      if (!receipt) {
        const response: ApiResponse = {
          success: true,
          data: {
            status: 'pending',
            hash,
            message: 'Transaction is still pending confirmation'
          },
          timestamp: new Date()
        }
        res.json(response)
        return
      }

      const response: ApiResponse = {
        success: true,
        data: {
          status: receipt.status === 1 ? 'confirmed' : 'failed',
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
          confirmations: await blockchainService.getBlockNumber(chainId) - receipt.blockNumber
        },
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get current gas price for transactions
   */
  async getGasPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const chainId = parseInt(req.query.chainId as string) || 43114
      
      const gasPrice = await blockchainService.getGasPrice(chainId)
      const avaxPrice = await defiDataService.getAVAXPrice()
      const gasPriceUSD = parseFloat(gasPrice) * avaxPrice

      const response: ApiResponse = {
        success: true,
        data: {
          gasPrice,
          gasPriceUSD: gasPriceUSD.toFixed(6),
          chainId
        },
        timestamp: new Date()
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Health check for blockchain connections
   */
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await blockchainService.healthCheck()
      const protocolData = await defiDataService.getAllProtocolData()
      
      const allHealthy = Object.values(health).every(status => status)
      const protocolsActive = protocolData.filter(p => p.isActive).length

      const response: ApiResponse = {
        success: allHealthy,
        data: {
          blockchain: health,
          protocols: {
            total: protocolData.length,
            active: protocolsActive,
            data: protocolData
          },
          status: allHealthy ? 'healthy' : 'degraded'
        },
        timestamp: new Date()
      }

      res.status(allHealthy ? 200 : 503).json(response)
    } catch (error) {
      next(error)
    }
  }
}

export const portfolioController = new PortfolioController()