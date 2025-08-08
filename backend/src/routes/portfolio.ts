import { Router } from 'express'
import { portfolioController } from '../controllers/portfolioController'
import { validateEthereumAddress } from '../middleware'

const router = Router()

/**
 * @route   GET /api/v1/portfolio/:address
 * @desc    Get user portfolio data from blockchain
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  '/:address',
  validateEthereumAddress('address'),
  portfolioController.getUserPortfolio
)

/**
 * @route   GET /api/v1/portfolio/:address/balance
 * @desc    Get user AVAX balance
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  '/:address/balance',
  validateEthereumAddress('address'),
  portfolioController.getUserBalance
)

/**
 * @route   GET /api/v1/portfolio/:address/rebalance-recommendation
 * @desc    Get rebalance recommendation for user portfolio
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  '/:address/rebalance-recommendation',
  validateEthereumAddress('address'),
  portfolioController.getRebalanceRecommendation
)

/**
 * @route   GET /api/v1/portfolio/transaction/:hash
 * @desc    Get transaction status and details
 * @access  Public
 * @param   hash - Transaction hash
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  '/transaction/:hash',
  portfolioController.getTransactionStatus
)

/**
 * @route   GET /api/v1/portfolio/gas-price
 * @desc    Get current gas price for transactions
 * @access  Public
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  '/gas-price',
  portfolioController.getGasPrice
)

/**
 * @route   GET /api/v1/portfolio/health
 * @desc    Health check for blockchain and DeFi services
 * @access  Public
 */
router.get(
  '/health',
  portfolioController.healthCheck
)

export default router