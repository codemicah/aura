import dotenv from 'dotenv'
import { ChainConfig } from '../types'

// Load environment variables
dotenv.config()

export const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  API_BASE_PATH: process.env.API_BASE_PATH || '/api/v1',

  // Database
  DATABASE_PATH: process.env.DATABASE_PATH || './data/defi-manager.db',

  // Network Configuration - Single chain from environment
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '31337', 10),
  RPC_URL: process.env.RPC_URL || 'http://localhost:8545',

  // Contract Addresses - All from environment variables
  YIELD_OPTIMIZER_ADDRESS: process.env.YIELD_OPTIMIZER_ADDRESS || '0x0000000000000000000000000000000000000000',
  TRADERJOE_ROUTER_ADDRESS: process.env.TRADERJOE_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  BENQI_COMPTROLLER_ADDRESS: process.env.BENQI_COMPTROLLER_ADDRESS || '0x0000000000000000000000000000000000000000',
  YIELDYAK_FARM_ADDRESS: process.env.YIELDYAK_FARM_ADDRESS || '0x0000000000000000000000000000000000000000',

  // External APIs
  TRADERJOE_API_URL: process.env.TRADERJOE_API_URL || 'https://api.traderjoexyz.com',
  BENQI_API_URL: process.env.BENQI_API_URL || 'https://api.benqi.fi',
  YIELDYAK_API_URL: process.env.YIELDYAK_API_URL || 'https://api.yieldyak.com',
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || '',
  DEFILLAMA_API_URL: process.env.DEFILLAMA_API_URL || 'https://api.llama.fi',

  // AI & Analytics
  ENABLE_AI_RECOMMENDATIONS: process.env.ENABLE_AI_RECOMMENDATIONS === 'true',
  MIN_PORTFOLIO_VALUE_USD: parseFloat(process.env.MIN_PORTFOLIO_VALUE_USD || '100'),
  REBALANCE_THRESHOLD_PERCENT: parseFloat(process.env.REBALANCE_THRESHOLD_PERCENT || '5'),

  // Security
  API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  API_WINDOW_MS: parseInt(process.env.API_WINDOW_MS || '900000', 10), // 15 minutes
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',

  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const

// Chain Configuration - Single chain based on environment
export const chainConfig: ChainConfig = (() => {
  const chainId = config.CHAIN_ID
  
  switch (chainId) {
    case 43114:
      return {
        chainId: 43114,
        name: 'Avalanche C-Chain',
        rpcUrl: config.RPC_URL,
        blockExplorer: 'https://snowtrace.io',
        nativeCurrency: {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18
        },
        contracts: {
          yieldOptimizer: config.YIELD_OPTIMIZER_ADDRESS,
          traderJoe: config.TRADERJOE_ROUTER_ADDRESS,
          benqi: config.BENQI_COMPTROLLER_ADDRESS,
          yieldYak: config.YIELDYAK_FARM_ADDRESS
        }
      }
    case 43113:
      return {
        chainId: 43113,
        name: 'Avalanche Fuji Testnet',
        rpcUrl: config.RPC_URL,
        blockExplorer: 'https://testnet.snowtrace.io',
        nativeCurrency: {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18
        },
        contracts: {
          yieldOptimizer: config.YIELD_OPTIMIZER_ADDRESS,
          traderJoe: config.TRADERJOE_ROUTER_ADDRESS,
          benqi: config.BENQI_COMPTROLLER_ADDRESS,
          yieldYak: config.YIELDYAK_FARM_ADDRESS
        }
      }
    case 31337:
    default:
      // Local Anvil - Note: MetaMask shows "ETH" for chain 31337 (expected behavior)
      return {
        chainId: chainId,
        name: 'Local Anvil',
        rpcUrl: config.RPC_URL,
        blockExplorer: '',
        nativeCurrency: {
          name: 'AVAX',
          symbol: 'AVAX',
          decimals: 18
        },
        contracts: {
          yieldOptimizer: config.YIELD_OPTIMIZER_ADDRESS,
          traderJoe: config.TRADERJOE_ROUTER_ADDRESS,
          benqi: config.BENQI_COMPTROLLER_ADDRESS,
          yieldYak: config.YIELDYAK_FARM_ADDRESS
        }
      }
  }
})()

// Validation
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_PATH',
  'RPC_URL',
  'CHAIN_ID'
]

export const validateConfig = (): void => {
  const missing = requiredEnvVars.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (config.isProduction) {
    const prodRequired = [
      'JWT_SECRET',
      'YIELD_OPTIMIZER_ADDRESS'
    ]
    
    const missingProd = prodRequired.filter(key => !process.env[key] || process.env[key] === 'default-secret-change-in-production')
    
    if (missingProd.length > 0) {
      throw new Error(`Missing required production environment variables: ${missingProd.join(', ')}`)
    }
  }
}

// Helper functions - Simplified for single chain
export const getChainConfig = (): ChainConfig => chainConfig

export const getCurrentChainConfig = (): ChainConfig => chainConfig