import { Router } from 'express'
import { marketController } from '../controllers/marketController'

const router = Router()

/**
 * @route   GET /api/v1/market/yields
 * @desc    Get current yields from all DeFi protocols
 * @access  Public
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  '/yields',
  marketController.getCurrentYields
)

/**
 * @route   GET /api/v1/market/data
 * @desc    Get comprehensive market data for all protocols
 * @access  Public
 */
router.get(
  '/data',
  marketController.getMarketData
)

/**
 * @route   GET /api/v1/market/avax-price
 * @desc    Get current AVAX price in USD
 * @access  Public
 */
router.get(
  '/avax-price',
  marketController.getAVAXPrice
)

/**
 * @route   GET /api/v1/market/protocol/:protocol
 * @desc    Get specific protocol data
 * @access  Public
 * @param   protocol - Protocol name (benqi, traderjoe, yieldyak)
 */
router.get(
  '/protocol/:protocol',
  marketController.getProtocolData
)

/**
 * @route   GET /api/v1/market/protocol/:protocol/history
 * @desc    Get historical yield data for a protocol
 * @access  Public
 * @param   protocol - Protocol name (benqi, traderjoe, yieldyak)
 * @query   days - Number of days of history (optional, defaults to 30)
 */
router.get(
  '/protocol/:protocol/history',
  marketController.getHistoricalYields
)

/**
 * @route   DELETE /api/v1/market/cache
 * @desc    Clear market data cache for fresh data
 * @access  Public (in production, this might require authentication)
 */
router.delete(
  '/cache',
  marketController.clearCache
)

/**
 * @route   GET /api/v1/market/cache/stats
 * @desc    Get cache statistics
 * @access  Public
 */
router.get(
  '/cache/stats',
  marketController.getCacheStats
)

export default router