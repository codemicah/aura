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

  // Blockchain Configuration
  AVALANCHE_RPC_URL: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
  AVALANCHE_FUJI_RPC_URL: process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '43114', 10),
  FUJI_CHAIN_ID: parseInt(process.env.FUJI_CHAIN_ID || '43113', 10),

  // Smart Contract Addresses
  YIELD_OPTIMIZER_MAINNET: process.env.YIELD_OPTIMIZER_MAINNET || '',
  YIELD_OPTIMIZER_FUJI: process.env.YIELD_OPTIMIZER_FUJI || '',

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

// Chain Configurations
export const chainConfigs: Record<number, ChainConfig> = {
  43114: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    rpcUrl: config.AVALANCHE_RPC_URL,
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    contracts: {
      yieldOptimizer: config.YIELD_OPTIMIZER_MAINNET
    }
  },
  43113: {
    chainId: 43113,
    name: 'Avalanche Fuji Testnet',
    rpcUrl: config.AVALANCHE_FUJI_RPC_URL,
    blockExplorer: 'https://testnet.snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    contracts: {
      yieldOptimizer: config.YIELD_OPTIMIZER_FUJI
    }
  }
}

// Validation
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_PATH',
  'AVALANCHE_RPC_URL'
]

export const validateConfig = (): void => {
  const missing = requiredEnvVars.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (config.isProduction) {
    const prodRequired = [
      'JWT_SECRET',
      'YIELD_OPTIMIZER_MAINNET'
    ]
    
    const missingProd = prodRequired.filter(key => !process.env[key] || process.env[key] === 'default-secret-change-in-production')
    
    if (missingProd.length > 0) {
      throw new Error(`Missing required production environment variables: ${missingProd.join(', ')}`)
    }
  }
}

// Helper functions
export const getChainConfig = (chainId: number): ChainConfig => {
  const chain = chainConfigs[chainId]
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return chain
}

export const getCurrentChainConfig = (): ChainConfig => {
  return getChainConfig(config.CHAIN_ID)
}