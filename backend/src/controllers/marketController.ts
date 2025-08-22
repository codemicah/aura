import { Request, Response, NextFunction } from "express";
import { defiDataService } from "../services/defi";
import { blockchainService } from "../services/blockchain";
import { logger } from "../utils/logger";
import { ApiResponse, APIError } from "../types";
import { config } from "../utils/config";

export class MarketController {
  /**
   * Get current yields from all DeFi protocols
   */
  async getCurrentYields(req: Request, res: Response, next: NextFunction) {
    try {
      const chainId = parseInt(req.query.chainId as string) || config.CHAIN_ID;

      logger.info("Fetching current yields", { chainId });

      // Get yields from smart contract (on-chain data)
      const onChainYields = await blockchainService.getCurrentYields(chainId);

      // Get yields from external APIs (off-chain data for comparison)
      const protocolData = await defiDataService.getAllProtocolData();

      // Filter out Benqi from frontend response - only send active protocols
      const activeProtocols = protocolData.filter(
        (p) => p.protocol !== "benqi"
      );

      const response: ApiResponse = {
        success: true,
        data: {
          onChain: {
            aave: onChainYields.aave,
            traderJoe: onChainYields.traderJoe,
            yieldYak: onChainYields.yieldYak,
            lastUpdated: onChainYields.lastUpdated,
          },
          offChain: {
            aave: protocolData.find((p) => p.protocol === "aave")?.apy || 0,
            traderJoe:
              protocolData.find((p) => p.protocol === "traderjoe")?.apy || 0,
            yieldYak:
              protocolData.find((p) => p.protocol === "yieldyak")?.apy || 0,
          },
          protocols: activeProtocols,
          lastUpdated: new Date(),
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed market data for all protocols
   */
  async getMarketData(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Fetching detailed market data");

      const [marketSummary, avaxPrice] = await Promise.all([
        defiDataService.getMarketSummary(),
        defiDataService.getAVAXPrice(),
      ]);

      // Calculate total metrics
      const totalTVL = marketSummary.reduce(
        (sum, market) => sum + parseFloat(market.tvl),
        0
      );

      const weightedAverageAPY =
        marketSummary.reduce(
          (sum, market) => sum + market.apy * parseFloat(market.tvl),
          0
        ) / totalTVL;

      const response: ApiResponse = {
        success: true,
        data: {
          protocols: marketSummary,
          summary: {
            totalTVL: totalTVL.toString(),
            totalTVLUSD: (totalTVL * avaxPrice).toFixed(2),
            averageAPY: weightedAverageAPY.toFixed(2),
            protocolCount: marketSummary.length,
            avaxPrice,
          },
          lastUpdated: new Date(),
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get AVAX price and market metrics
   */
  async getAVAXPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const avaxPrice = await defiDataService.getAVAXPrice();

      const response: ApiResponse = {
        success: true,
        data: {
          price: avaxPrice,
          currency: "USD",
          source: "CoinGecko",
          lastUpdated: new Date(),
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific protocol data
   */
  async getProtocolData(req: Request, res: Response, next: NextFunction) {
    try {
      const { protocol } = req.params;

      if (!["aave", "traderjoe", "yieldyak"].includes(protocol)) {
        throw new APIError(
          "Invalid protocol specified. Supported protocols: aave, traderjoe, yieldyak",
          400
        );
      }

      let protocolData;
      switch (protocol) {
        case "aave":
          protocolData = await defiDataService.getAaveData();
          break;
        case "traderjoe":
          protocolData = await defiDataService.getTraderJoeData();
          break;
        case "yieldyak":
          protocolData = await defiDataService.getYieldYakData();
          break;
        default:
          throw new APIError("Protocol not supported", 400);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          protocol,
          data: protocolData[0], // Most protocols return array with single item
          isActive: protocolData[0]?.isActive || false,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get historical yield data (mock implementation for now)
   */
  async getHistoricalYields(req: Request, res: Response, next: NextFunction) {
    try {
      const { protocol } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      if (!["aave", "traderjoe", "yieldyak"].includes(protocol)) {
        throw new APIError(
          "Invalid protocol specified. Supported protocols: aave, traderjoe, yieldyak",
          400
        );
      }

      // Mock historical data - in production, this would come from a time-series database
      const generateMockHistory = (baseAPY: number, days: number) => {
        const history = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const variation = (Math.random() - 0.5) * 2; // ±1% variation
          const apy = Math.max(0, baseAPY + variation);

          history.push({
            date: date.toISOString().split("T")[0],
            apy: parseFloat(apy.toFixed(2)),
            timestamp: date,
          });
        }

        return history;
      };

      const baseAPYs = {
        aave: 5.5, // Use Aave instead of Benqi with slightly higher APY
        traderjoe: 8.7,
        yieldyak: 12.4,
      };

      const historicalData = generateMockHistory(
        baseAPYs[protocol as keyof typeof baseAPYs],
        days
      );

      const response: ApiResponse = {
        success: true,
        data: {
          protocol,
          period: `${days} days`,
          data: historicalData,
          summary: {
            averageAPY: (
              historicalData.reduce((sum, d) => sum + d.apy, 0) /
              historicalData.length
            ).toFixed(2),
            minAPY: Math.min(...historicalData.map((d) => d.apy)).toFixed(2),
            maxAPY: Math.max(...historicalData.map((d) => d.apy)).toFixed(2),
            currentAPY:
              historicalData[historicalData.length - 1].apy.toFixed(2),
          },
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear cache for fresh data
   */
  async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      defiDataService.clearCache();

      const response: ApiResponse = {
        success: true,
        data: {
          message: "Cache cleared successfully",
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = defiDataService.getCacheStats();

      const response: ApiResponse = {
        success: true,
        data: {
          cache: stats,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const marketController = new MarketController();
