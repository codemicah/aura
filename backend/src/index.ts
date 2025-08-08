#!/usr/bin/env node

import express from 'express'
import { config, validateConfig } from './utils/config'
import { logger } from './utils/logger'
import { applyCommonMiddleware, errorHandler, notFoundHandler } from './middleware'
import routes from './routes'
import { databaseService } from './services/database'
import { blockchainService } from './services/blockchain'
import { defiDataService } from './services/defi'

// Validate configuration before starting
try {
  validateConfig()
} catch (error) {
  console.error('Configuration validation failed:', error)
  process.exit(1)
}

// Create Express application
const app = express()

// Apply common middleware
applyCommonMiddleware(app)

// API Routes
app.use(config.API_BASE_PATH, routes)

// Error handling middleware (must be last)
app.use(notFoundHandler)
app.use(errorHandler)

// Server startup
async function startServer() {
  try {
    logger.info('Starting Personal DeFi Wealth Manager Backend...')

    // Health checks for all services
    const [dbHealth, blockchainHealth] = await Promise.all([
      databaseService.healthCheck(),
      blockchainService.healthCheck()
    ])

    logger.info('Service health checks completed', {
      database: dbHealth,
      blockchain: blockchainHealth,
      environment: config.NODE_ENV
    })

    // Start the server
    const server = app.listen(config.PORT, () => {
      logger.info(`Server started successfully`, {
        port: config.PORT,
        environment: config.NODE_ENV,
        apiBasePath: config.API_BASE_PATH,
        pid: process.pid
      })

      // Log important configuration (without secrets)
      logger.info('Configuration loaded', {
        chainId: config.CHAIN_ID,
        databasePath: config.DATABASE_PATH,
        logLevel: config.LOG_LEVEL,
        rateLimitEnabled: config.isProduction,
        aiRecommendationsEnabled: config.ENABLE_AI_RECOMMENDATIONS
      })

      // API endpoints summary
      console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                Personal DeFi Wealth Manager API                 │
├─────────────────────────────────────────────────────────────────┤
│ Environment: ${config.NODE_ENV.padEnd(47)} │
│ Server:      http://localhost:${config.PORT.toString().padEnd(37)} │
│ Health:      http://localhost:${config.PORT}/health${' '.repeat(25)} │
│ API Docs:    http://localhost:${config.PORT}${config.API_BASE_PATH}${' '.repeat(25)} │
│ Database:    ${dbHealth ? '✅ Connected' : '❌ Disconnected'.padEnd(47)} │
│ Blockchain:  ${Object.values(blockchainHealth).every(h => h) ? '✅ Connected' : '❌ Issues detected'.padEnd(47)} │
└─────────────────────────────────────────────────────────────────┘
      `)
    })

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`)
      
      server.close(async () => {
        logger.info('HTTP server closed')
        
        try {
          await databaseService.close()
          logger.info('Database connection closed')
        } catch (error) {
          logger.error('Error closing database', error as Error)
        }
        
        logger.info('Graceful shutdown completed')
        process.exit(0)
      })

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down')
        process.exit(1)
      }, 10000)
    }

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error)
      gracefulShutdown('uncaughtException')
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', new Error(String(reason)), {
        promise: promise.toString()
      })
      gracefulShutdown('unhandledRejection')
    })

  } catch (error) {
    logger.error('Failed to start server', error as Error)
    process.exit(1)
  }
}

// Start the server
if (require.main === module) {
  startServer()
}

export default app