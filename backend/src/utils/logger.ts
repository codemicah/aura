import { config } from './config'
import fs from 'fs'
import path from 'path'

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  metadata?: Record<string, any>
  error?: Error
}

class Logger {
  private logLevels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  }

  private currentLevel: LogLevel = config.LOG_LEVEL as LogLevel || 'info'

  constructor() {
    // Ensure log directory exists
    const logDir = path.dirname(config.LOG_FILE_PATH)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] <= this.logLevels[this.currentLevel]
  }

  private formatMessage(entry: LogEntry): string {
    let message = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      message += ` | Data: ${JSON.stringify(entry.metadata)}`
    }
    
    if (entry.error) {
      message += ` | Error: ${entry.error.message}`
      if (entry.error.stack && config.isDevelopment) {
        message += `\nStack: ${entry.error.stack}`
      }
    }
    
    return message
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const message = this.formatMessage(entry) + '\n'
      fs.appendFileSync(config.LOG_FILE_PATH, message)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const message = this.formatMessage(entry)
    
    switch (entry.level) {
      case 'error':
        console.error(message)
        break
      case 'warn':
        console.warn(message)
        break
      case 'info':
        console.info(message)
        break
      case 'debug':
        console.debug(message)
        break
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      error
    }

    // Always write to console in development
    if (config.isDevelopment || level === 'error') {
      this.writeToConsole(entry)
    }

    // Write to file in production or if explicitly configured
    if (config.isProduction || config.LOG_FILE_PATH) {
      this.writeToFile(entry)
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, metadata, error)
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata)
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata)
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata)
  }

  // Convenience methods for common logging scenarios
  request(method: string, url: string, statusCode: number, duration: number, metadata?: Record<string, any>): void {
    this.info(`${method} ${url} ${statusCode} ${duration}ms`, metadata)
  }

  blockchain(action: string, chainId: number, metadata?: Record<string, any>): void {
    this.info(`Blockchain: ${action}`, { chainId, ...metadata })
  }

  transaction(hash: string, status: 'pending' | 'confirmed' | 'failed', metadata?: Record<string, any>): void {
    this.info(`Transaction ${status}: ${hash}`, metadata)
  }

  ai(action: string, confidence?: number, metadata?: Record<string, any>): void {
    this.info(`AI: ${action}`, { confidence, ...metadata })
  }
}

export const logger = new Logger()

// Express middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const metadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined
    }
    
    logger.request(req.method, req.originalUrl, res.statusCode, duration, metadata)
  })
  
  next()
}