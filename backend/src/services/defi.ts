import { config } from "../utils/config";
import { logger } from "../utils/logger";
import { APIError, YieldData, MarketData } from "../types";
import { blockchainService } from "./blockchain";

export class DeFiDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    logger.info("DeFi Data Service initialized");
  }

  private getCacheKey(service: string, endpoint: string): string {
    return `${service}:${endpoint}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    return (
      cached !== undefined && Date.now() - cached.timestamp < this.cacheExpiry
    );
  }

  private async fetchWithCache(url: string, cacheKey: string): Promise<any> {
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      logger.debug(`Cache hit for ${cacheKey}`);
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Store in cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      logger.debug(`Cache miss for ${cacheKey}, data fetched and cached`);
      return data;
    } catch (error) {
      logger.error(`Failed to fetch ${url}`, error as Error);
      throw new APIError(`Failed to fetch data from ${url}`);
    }
  }

  async getTraderJoeData(): Promise<YieldData[]> {
    try {
      // Try to get real yields from smart contract first
      if (blockchainService.hasContract()) {
        const yields = await blockchainService.getCurrentYields();
        return [
          {
            protocol: "traderjoe",
            apy: yields.traderJoe,
            tvl: "15000000", // TVL would need separate data source
            lastUpdated: yields.lastUpdated,
            isActive: true,
          },
        ];
      }

      // Fallback for when contract is not available
      logger.warn(
        "Smart contract not available, using fallback TraderJoe data"
      );
      return [
        {
          protocol: "traderjoe",
          apy: 8.7,
          tvl: "15000000",
          lastUpdated: new Date(),
          isActive: false,
        },
      ];
    } catch (error) {
      logger.error("Failed to fetch TraderJoe data", error as Error);
      return [
        {
          protocol: "traderjoe",
          apy: 8.7, // Fallback value
          tvl: "15000000",
          lastUpdated: new Date(),
          isActive: false,
        },
      ];
    }
  }

  // Legacy Benqi support (kept for future use but not used in active allocations)
  private async getBenqiData(): Promise<YieldData[]> {
    try {
      return [
        {
          protocol: "benqi",
          apy: 5.2,
          tvl: "8500000",
          lastUpdated: new Date(),
          isActive: false, // Always inactive to prevent use in allocations
        },
      ];
    } catch (error) {
      logger.error("Failed to fetch Benqi data", error as Error);
      return [
        {
          protocol: "benqi",
          apy: 5.2, // Fallback value
          tvl: "8500000",
          lastUpdated: new Date(),
          isActive: false,
        },
      ];
    }
  }

  // Active Aave V3 integration (replaces Benqi in allocations)
  async getAaveData(): Promise<YieldData[]> {
    try {
      // Try to get real yields from smart contract first
      if (blockchainService.hasContract()) {
        const yields = await blockchainService.getCurrentYields();
        return [
          {
            protocol: "aave",
            apy: yields.aave || 5.5, // Use aave field only, no fallback to benqi
            tvl: "10000000000", // $10B+ TVL for Aave V3
            lastUpdated: yields.lastUpdated,
            isActive: true,
          },
        ];
      }

      // Fallback for when contract is not available
      logger.warn("Smart contract not available, using fallback Aave data");
      const baseAPY = 5.5;
      const variation = (Math.random() - 0.5) * 1.0; // ±0.5% variation

      return [
        {
          protocol: "aave",
          apy: Math.max(3.0, baseAPY + variation), // Minimum 3% APY
          tvl: "10000000000", // $10B+ TVL
          lastUpdated: new Date(),
          isActive: false,
        },
      ];
    } catch (error) {
      logger.error("Failed to fetch Aave data", error as Error);
      return [
        {
          protocol: "aave",
          apy: 5.5, // Fallback value
          tvl: "10000000000",
          lastUpdated: new Date(),
          isActive: false,
        },
      ];
    }
  }

  async getYieldYakData(): Promise<YieldData[]> {
    try {
      // Try to get real yields from smart contract first
      if (blockchainService.hasContract()) {
        const yields = await blockchainService.getCurrentYields();
        return [
          {
            protocol: "yieldyak",
            apy: yields.yieldYak,
            tvl: "5000000", // TVL would need separate data source
            lastUpdated: yields.lastUpdated,
            isActive: true,
          },
        ];
      }

      // Fallback for testnet where YieldYak is not available
      logger.warn(
        "YieldYak data not available on testnet, using simulated data"
      );
      return [
        {
          protocol: "yieldyak",
          apy: 12.4, // Simulated APY
          tvl: "5000000", // Simulated TVL
          lastUpdated: new Date(),
          isActive: false, // Mark as inactive to indicate it's simulated
        },
      ];
    } catch (error) {
      logger.error("Failed to fetch YieldYak data", error as Error);
      return [
        {
          protocol: "yieldyak",
          apy: 12.4, // Fallback value
          tvl: "5000000",
          lastUpdated: new Date(),
          isActive: false,
        },
      ];
    }
  }

  async getAllProtocolData(): Promise<YieldData[]> {
    try {
      // Active protocols: Aave (replaces Benqi), TraderJoe, YieldYak
      const [traderJoeData, aaveData, yieldYakData] = await Promise.all([
        this.getTraderJoeData(),
        this.getAaveData(),
        this.getYieldYakData(),
      ]);

      const allData = [...traderJoeData, ...aaveData, ...yieldYakData];

      logger.info(
        "Active protocol data fetched successfully (Benqi excluded)",
        {
          protocols: allData.length,
          active: allData.filter((d) => d.isActive).length,
          protocolNames: allData.map((d) => d.protocol),
        }
      );

      return allData;
    } catch (error) {
      logger.error("Failed to fetch all protocol data", error as Error);
      throw new APIError("Failed to fetch DeFi protocol data");
    }
  }

  async getAVAXPrice(): Promise<number> {
    try {
      const cacheKey = this.getCacheKey("coingecko", "avax-price");

      // Using CoinGecko free API
      const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd";
      const data = await this.fetchWithCache(url, cacheKey);

      const price = data["avalanche-2"]?.usd;
      if (typeof price === "number" && price > 0) {
        logger.info(`AVAX price fetched: $${price}`);
        return price;
      }

      // Fallback price
      logger.warn("Using fallback AVAX price");
      return 45.23;
    } catch (error) {
      logger.error("Failed to fetch AVAX price", error as Error);
      return 45.23; // Fallback price
    }
  }

  async getMarketSummary(): Promise<MarketData[]> {
    try {
      const [protocols, avaxPrice] = await Promise.all([
        this.getAllProtocolData(),
        this.getAVAXPrice(),
      ]);

      const marketData: MarketData[] = protocols.map((protocol) => ({
        protocol: protocol.protocol,
        apy: protocol.apy,
        tvl: protocol.tvl,
        volume24h: "0", // Would need additional API calls
        fees24h: "0", // Would need additional API calls
        utilization: 0, // Would need additional API calls
        timestamp: new Date(),
      }));

      logger.info("Market summary generated", {
        protocols: marketData.length,
        avaxPrice,
      });

      return marketData;
    } catch (error) {
      logger.error("Failed to generate market summary", error as Error);
      throw new APIError("Failed to generate market summary");
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
    logger.info("DeFi data cache cleared");
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const defiDataService = new DeFiDataService();
