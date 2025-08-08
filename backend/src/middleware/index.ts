import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { config } from '../utils/config'
import { logger, requestLogger } from '../utils/logger'
import { APIError } from '../types'

// CORS configuration
export const corsMiddleware = cors({
  origin: config.isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:3001'] 
    : process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-frontend-domain.com'],
  credentials: true,
  optionsSuccessStatus: 200
})

// Security headers
export const helmetMiddleware = helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: config.isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
})

// Rate limiting
export const rateLimitMiddleware = rateLimit({
  windowMs: config.API_WINDOW_MS,
  max: config.API_RATE_LIMIT,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    })
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      timestamp: new Date().toISOString()
    })
  }
})

// Body parsing
export const bodyParserMiddleware = [
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' })
]

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      // Simple validation - in production you'd use a library like Joi or Zod
      if (schema.required) {
        const missing = schema.required.filter((field: string) => 
          req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
        )
        
        if (missing.length > 0) {
          res.status(400).json({
            success: false,
            error: `Missing required fields: ${missing.join(', ')}`,
            timestamp: new Date().toISOString()
          })
          return
        }
      }
      
      next()
    } catch (error) {
      logger.error('Request validation error', error as Error)
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Ethereum address validation middleware
export const validateEthereumAddress = (field: string = 'address') => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const address = req.body[field] || req.params[field]
    
    if (!address) {
      res.status(400).json({
        success: false,
        error: `${field} is required`,
        timestamp: new Date().toISOString()
      })
      return
    }
    
    // Basic Ethereum address validation (0x + 40 hex chars)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({
        success: false,
        error: `Invalid Ethereum address format for ${field}`,
        timestamp: new Date().toISOString()
      })
      return
    }
    
    next()
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  logger.error('API Error', err, {
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params
  })

  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    })
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: config.isDevelopment ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  })
}

// 404 handler
export const notFoundHandler = (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  })
}

// Health check middleware
export const healthCheck = (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    data: {
      service: 'Personal DeFi Wealth Manager Backend',
      version: '1.0.0',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })
  return
}

// Morgan HTTP request logger
export const morganMiddleware = morgan(
  config.isDevelopment 
    ? 'dev' 
    : 'combined',
  {
    stream: {
      write: (message: string) => {
        logger.info(message.trim())
      }
    },
    skip: (req: any, res: any) => {
      // Skip health check requests to reduce noise
      return req.path === '/health' || req.path === '/api/health'
    }
  }
)

// Apply all common middleware
export const applyCommonMiddleware = (app: express.Application) => {
  // Security and parsing
  app.use(helmetMiddleware)
  app.use(corsMiddleware)
  app.use(...bodyParserMiddleware)
  
  // Logging
  app.use(morganMiddleware)
  app.use(requestLogger)
  
  // Rate limiting (only in production or if explicitly enabled)
  if (config.isProduction || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use(rateLimitMiddleware)
  }
  
  // Health check
  app.get('/health', healthCheck)
  app.get('/api/health', healthCheck)
}