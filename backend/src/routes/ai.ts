import { Router } from 'express'
import { aiController } from '../controllers/aiController'
import { validateRequest, validateEthereumAddress } from '../middleware'
import { logger } from '../utils/logger'

const router = Router()

/**
 * Calculate risk score from assessment answers
 * POST /api/v1/ai/risk-score
 */
router.post('/risk-score', 
  validateRequest({
    required: ['age', 'income', 'monthlyExpenses', 'investmentGoal', 'riskTolerance', 'investmentExperience']
  }),
  aiController.calculateRiskScore.bind(aiController)
)

/**
 * Generate allocation strategy based on risk score
 * POST /api/v1/ai/allocation
 */
router.post('/allocation',
  validateRequest({
    required: ['riskScore']
  }),
  aiController.generateAllocation.bind(aiController)
)

/**
 * Calculate surplus available for investment
 * POST /api/v1/ai/surplus
 */
router.post('/surplus',
  validateRequest({
    required: ['monthlyIncome', 'monthlyExpenses']
  }),
  aiController.calculateSurplus.bind(aiController)
)

/**
 * Generate personalized investment recommendation
 * POST /api/v1/ai/recommendation
 */
router.post('/recommendation',
  validateRequest({
    required: ['address']
  }),
  validateEthereumAddress('address'),
  aiController.generateRecommendation.bind(aiController)
)

/**
 * Get all risk profiles and their characteristics
 * GET /api/v1/ai/risk-profiles
 */
router.get('/risk-profiles', aiController.getRiskProfiles.bind(aiController))

/**
 * Analyze portfolio performance and suggest improvements
 * POST /api/v1/ai/analyze-portfolio
 */
router.post('/analyze-portfolio',
  validateRequest({
    required: ['address']
  }),
  validateEthereumAddress('address'),
  aiController.analyzePortfolio.bind(aiController)
)

/**
 * Get AI service health and statistics
 * GET /api/v1/ai/health
 */
router.get('/health', aiController.getAIHealth.bind(aiController))

// Log AI routes registration
logger.info('AI routes registered', {
  routes: [
    'POST /ai/risk-score',
    'POST /ai/allocation',
    'POST /ai/surplus', 
    'POST /ai/recommendation',
    'GET /ai/risk-profiles',
    'POST /ai/analyze-portfolio',
    'GET /ai/health'
  ]
})

export default router