import { config } from '../utils/config'
import { logger } from '../utils/logger'
import { APIError, YieldData, MarketData } from '../types'

export class DeFiDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheExpiry = 5 * 60 * 1000 // 5 minutes

  constructor() {
    logger.info('DeFi Data Service initialized')
  }

  private getCacheKey(service: string, endpoint: string): string {
    return `${service}:${endpoint}`
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey)
    return cached !== undefined && (Date.now() - cached.timestamp) < this.cacheExpiry
  }

  private async fetchWithCache(url: string, cacheKey: string): Promise<any> {
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      logger.debug(`Cache hit for ${cacheKey}`)
      return cached.data
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Store in cache
      this.cache.set(cacheKey, { 
        data, 
        timestamp: Date.now() 
      })
      
      logger.debug(`Cache miss for ${cacheKey}, data fetched and cached`)
      return data
    } catch (error) {
      logger.error(`Failed to fetch ${url}`, error as Error)
      throw new APIError(`Failed to fetch data from ${url}`)
    }
  }

  async getTraderJoeData(): Promise<YieldData[]> {
    try {
      // Mock TraderJoe API data - replace with actual API when available
      const mockData = {
        pools: [
          {
            pair: 'AVAX/USDC',
            apy: 8.5,
            tvl: '15000000',
            volume24h: '2500000'
          }
        ]
      }

      return [{
        protocol: 'traderjoe',
        apy: mockData.pools[0].apy,
        tvl: mockData.pools[0].tvl,
        lastUpdated: new Date(),
        isActive: true
      }]
    } catch (error) {
      logger.error('Failed to fetch TraderJoe data', error as Error)
      return [{
        protocol: 'traderjoe',
        apy: 8.7, // Fallback value
        tvl: '15000000',
        lastUpdated: new Date(),
        isActive: false
      }]
    }
  }

  async getBenqiData(): Promise<YieldData[]> {
    try {
      // Mock Benqi API data - replace with actual API when available
      const mockData = {
        markets: [
          {
            asset: 'AVAX',
            supplyApy: 5.2,
            totalSupply: '8500000'
          }
        ]
      }

      return [{
        protocol: 'benqi',
        apy: mockData.markets[0].supplyApy,
        tvl: mockData.markets[0].totalSupply,
        lastUpdated: new Date(),
        isActive: true
      }]
    } catch (error) {
      logger.error('Failed to fetch Benqi data', error as Error)
      return [{
        protocol: 'benqi',
        apy: 5.2, // Fallback value
        tvl: '8500000',
        lastUpdated: new Date(),
        isActive: false
      }]
    }
  }

  async getYieldYakData(): Promise<YieldData[]> {
    try {
      // YieldYak API integration - they have public APIs
      const cacheKey = this.getCacheKey('yieldyak', 'farms')
      const url = `${config.YIELDYAK_API_URL}/farms`
      
      const data = await this.fetchWithCache(url, cacheKey)
      
      // Process YieldYak response - structure may vary
      if (data && Array.isArray(data)) {
        const avaxFarms = data.filter((farm: any) => 
          farm.name?.toLowerCase().includes('avax') ||
          farm.symbol?.toLowerCase().includes('avax')
        )
        
        if (avaxFarms.length > 0) {
          const bestFarm = avaxFarms.reduce((best: any, current: any) => 
            (current.apy || 0) > (best.apy || 0) ? current : best
          )
          
          return [{
            protocol: 'yieldyak',
            apy: bestFarm.apy || 12.4,
            tvl: bestFarm.tvl?.toString() || '5000000',
            lastUpdated: new Date(),
            isActive: true
          }]
        }
      }
      
      // Fallback if no farms found
      return [{
        protocol: 'yieldyak',
        apy: 12.4,
        tvl: '5000000',
        lastUpdated: new Date(),
        isActive: false
      }]
    } catch (error) {
      logger.error('Failed to fetch YieldYak data', error as Error)
      return [{
        protocol: 'yieldyak',
        apy: 12.4, // Fallback value
        tvl: '5000000',
        lastUpdated: new Date(),
        isActive: false
      }]
    }
  }

  async getAllProtocolData(): Promise<YieldData[]> {
    try {
      const [traderJoeData, benqiData, yieldYakData] = await Promise.all([
        this.getTraderJoeData(),
        this.getBenqiData(),
        this.getYieldYakData()
      ])

      const allData = [...traderJoeData, ...benqiData, ...yieldYakData]
      
      logger.info('All protocol data fetched successfully', {
        protocols: allData.length,
        active: allData.filter(d => d.isActive).length
      })
      
      return allData
    } catch (error) {
      logger.error('Failed to fetch all protocol data', error as Error)
      throw new APIError('Failed to fetch DeFi protocol data')
    }
  }

  async getAVAXPrice(): Promise<number> {
    try {
      const cacheKey = this.getCacheKey('coingecko', 'avax-price')
      
      // Using CoinGecko free API
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd'
      const data = await this.fetchWithCache(url, cacheKey)
      
      const price = data['avalanche-2']?.usd
      if (typeof price === 'number' && price > 0) {
        logger.info(`AVAX price fetched: $${price}`)
        return price
      }
      
      // Fallback price
      logger.warn('Using fallback AVAX price')
      return 45.23
    } catch (error) {
      logger.error('Failed to fetch AVAX price', error as Error)
      return 45.23 // Fallback price
    }
  }

  async getMarketSummary(): Promise<MarketData[]> {
    try {
      const [protocols, avaxPrice] = await Promise.all([
        this.getAllProtocolData(),
        this.getAVAXPrice()
      ])

      const marketData: MarketData[] = protocols.map(protocol => ({
        protocol: protocol.protocol,
        apy: protocol.apy,
        tvl: protocol.tvl,
        volume24h: '0', // Would need additional API calls
        fees24h: '0',   // Would need additional API calls
        utilization: 0,  // Would need additional API calls
        timestamp: new Date()
      }))

      logger.info('Market summary generated', { 
        protocols: marketData.length,
        avaxPrice 
      })

      return marketData
    } catch (error) {
      logger.error('Failed to generate market summary', error as Error)
      throw new APIError('Failed to generate market summary')
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear()
    logger.info('DeFi data cache cleared')
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Singleton instance
export const defiDataService = new DeFiDataService()