import { Router } from 'express'
import portfolioRoutes from './portfolio'
import marketRoutes from './market'
import aiRoutes from './ai'
import backtestingRoutes from './backtesting'
import analyticsRoutes from './analytics'

const router = Router()

// API Documentation route
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Personal DeFi Wealth Manager API',
      version: '1.0.0',
      description: 'AI-powered yield optimization backend for Avalanche DeFi protocols',
      endpoints: {
        portfolio: {
          baseUrl: '/api/v1/portfolio',
          routes: [
            'GET /:address - Get user portfolio data',
            'GET /:address/balance - Get user AVAX balance', 
            'GET /:address/rebalance-recommendation - Get rebalance recommendation',
            'GET /transaction/:hash - Get transaction status',
            'GET /gas-price - Get current gas price',
            'GET /health - Health check'
          ]
        },
        market: {
          baseUrl: '/api/v1/market',
          routes: [
            'GET /yields - Get current protocol yields',
            'GET /data - Get comprehensive market data',
            'GET /avax-price - Get AVAX price',
            'GET /protocol/:protocol - Get specific protocol data',
            'GET /protocol/:protocol/history - Get historical yield data',
            'DELETE /cache - Clear market data cache',
            'GET /cache/stats - Get cache statistics'
          ]
        },
        ai: {
          baseUrl: '/api/v1/ai',
          routes: [
            'POST /risk-score - Calculate risk score from assessment',
            'POST /allocation - Generate allocation strategy',
            'POST /surplus - Calculate investment surplus',
            'POST /recommendation - Generate investment recommendation',
            'GET /risk-profiles - Get all risk profile information',
            'POST /analyze-portfolio - Analyze portfolio performance',
            'GET /health - AI service health check'
          ]
        },
        backtesting: {
          baseUrl: '/api/v1/backtesting',
          routes: [
            'POST /run - Run backtesting simulation',
            'POST /scenarios - Run multiple scenario analysis',
            'GET /predefined-scenarios - Get predefined test scenarios'
          ]
        },
        analytics: {
          baseUrl: '/api/v1/analytics',
          routes: [
            'GET /metrics/:userId - Get performance metrics',
            'GET /protocols/:userId - Get protocol-specific performance',
            'GET /benchmarks/:userId - Get benchmark comparisons',
            'GET /risk/:userId - Get risk metrics',
            'GET /dashboard/:userId - Get complete analytics dashboard'
          ]
        }
      },
      supportedChains: [
        {
          chainId: 43114,
          name: 'Avalanche C-Chain',
          rpc: 'https://api.avax.network/ext/bc/C/rpc'
        },
        {
          chainId: 43113,
          name: 'Avalanche Fuji Testnet',
          rpc: 'https://api.avax-test.network/ext/bc/C/rpc'
        }
      ],
      protocols: [
        {
          name: 'Benqi',
          type: 'Lending',
          description: 'Decentralized lending protocol on Avalanche'
        },
        {
          name: 'TraderJoe',
          type: 'DEX/LP',
          description: 'Decentralized exchange and liquidity provision'
        },
        {
          name: 'YieldYak',
          type: 'Yield Farming',
          description: 'Auto-compounding yield farming strategies'
        }
      ]
    },
    timestamp: new Date()
  })
})

// Mount route modules
router.use('/portfolio', portfolioRoutes)
router.use('/market', marketRoutes)
router.use('/ai', aiRoutes)
router.use('/backtesting', backtestingRoutes)
router.use('/analytics', analyticsRoutes)

export default router