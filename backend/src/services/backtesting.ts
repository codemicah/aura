import { logger } from "../utils/logger";
import { aiService } from "./ai";
import { defiDataService } from "./defi";
import { AllocationStrategy } from "./ai";

export interface BacktestParams {
  initialAmount: number;
  riskScore: number;
  startDate: Date;
  endDate: Date;
  rebalanceFrequency: number; // days
  compoundingEnabled: boolean;
}

export interface BacktestResult {
  finalValue: number;
  totalReturn: number;
  returnPercentage: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  rebalanceCount: number;
  timeline: TimelineEntry[];
  comparisonBenchmark: {
    holdAvax: number;
    holdUsdc: number;
    traditionalSavings: number;
  };
}

export interface TimelineEntry {
  date: Date;
  portfolioValue: number;
  allocation: AllocationStrategy;
  yields: {
    aave: number; // Use Aave instead of Benqi
    traderJoe: number;
    yieldYak: number;
  };
  action?: "rebalance" | "compound";
  gasUsed?: number;
}

// Historical yield data (mock data for backtesting)
const HISTORICAL_YIELDS = {
  aave: {
    // Use Aave instead of Benqi
    base: 5.5, // Slightly higher than old Benqi rate
    volatility: 1.0, // Lower volatility for enterprise-grade protocol
    trend: 0.02, // slight upward trend
  },
  traderJoe: {
    base: 8.7,
    volatility: 3.2,
    trend: -0.01, // slight downward trend
  },
  yieldYak: {
    base: 12.4,
    volatility: 5.8,
    trend: 0.03,
  },
};

// Market conditions simulator
const MARKET_CONDITIONS = [
  { name: "bull", probability: 0.3, yieldMultiplier: 1.5 },
  { name: "normal", probability: 0.5, yieldMultiplier: 1.0 },
  { name: "bear", probability: 0.2, yieldMultiplier: 0.6 },
];

export class BacktestingService {
  constructor() {
    logger.info("Backtesting Service initialized");
  }

  /**
   * Run backtesting simulation
   */
  async runBacktest(params: BacktestParams): Promise<BacktestResult> {
    const {
      initialAmount,
      riskScore,
      startDate,
      endDate,
      rebalanceFrequency,
      compoundingEnabled,
    } = params;

    logger.info("Starting backtest simulation", {
      initialAmount,
      riskScore,
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    });

    // Initialize portfolio
    let portfolioValue = initialAmount;
    const timeline: TimelineEntry[] = [];
    let rebalanceCount = 0;
    let lastRebalanceDate = startDate;
    let maxValue = initialAmount;
    let maxDrawdown = 0;

    // Get initial allocation strategy
    const allocation = await aiService.generateAllocationStrategy(riskScore);

    // Simulate day by day
    const currentDate = new Date(startDate);
    const endTime = endDate.getTime();

    while (currentDate.getTime() <= endTime) {
      // Generate daily yields with randomness
      const dailyYields = this.generateDailyYields(currentDate);

      // Calculate portfolio growth
      const dailyReturn = this.calculateDailyReturn(
        portfolioValue,
        allocation,
        dailyYields
      );

      portfolioValue += dailyReturn;

      // Apply compounding if enabled
      if (compoundingEnabled && dailyReturn > 0) {
        portfolioValue *= 1.0001; // Small compounding bonus
      }

      // Check for rebalancing
      const daysSinceRebalance = Math.floor(
        (currentDate.getTime() - lastRebalanceDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let action: TimelineEntry["action"] = undefined;
      let gasUsed = 0;

      if (daysSinceRebalance >= rebalanceFrequency) {
        // Rebalance portfolio
        const newAllocation = await aiService.generateAllocationStrategy(
          riskScore,
          this.getMockMarketData(dailyYields)
        );

        action = "rebalance";
        gasUsed = 0.5; // Mock gas cost in AVAX
        portfolioValue -= gasUsed * 45; // Subtract gas cost (assuming $45 AVAX)

        rebalanceCount++;
        lastRebalanceDate = new Date(currentDate);

        logger.debug("Rebalancing portfolio", {
          date: currentDate.toISOString(),
          oldAllocation: allocation,
          newAllocation,
        });
      }

      // Track timeline
      timeline.push({
        date: new Date(currentDate),
        portfolioValue,
        allocation,
        yields: dailyYields,
        action,
        gasUsed,
      });

      // Track max drawdown
      if (portfolioValue > maxValue) {
        maxValue = portfolioValue;
      } else {
        const drawdown = ((maxValue - portfolioValue) / maxValue) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate final metrics
    const totalReturn = portfolioValue - initialAmount;
    const returnPercentage = (totalReturn / initialAmount) * 100;
    const dayCount = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const annualizedReturn = this.calculateAnnualizedReturn(
      initialAmount,
      portfolioValue,
      dayCount
    );

    // Calculate volatility and Sharpe ratio
    const { volatility, sharpeRatio } = this.calculateRiskMetrics(timeline);

    // Calculate benchmark comparisons
    const comparisonBenchmark = this.calculateBenchmarks(
      initialAmount,
      dayCount
    );

    const result: BacktestResult = {
      finalValue: portfolioValue,
      totalReturn,
      returnPercentage,
      annualizedReturn,
      maxDrawdown,
      sharpeRatio,
      volatility,
      rebalanceCount,
      timeline,
      comparisonBenchmark,
    };

    logger.info("Backtest completed", {
      finalValue: portfolioValue.toFixed(2),
      returnPercentage: returnPercentage.toFixed(2),
      annualizedReturn: annualizedReturn.toFixed(2),
    });

    return result;
  }

  /**
   * Generate daily yields with realistic randomness
   */
  private generateDailyYields(date: Date): {
    aave: number; // Use Aave instead of Benqi
    traderJoe: number;
    yieldYak: number;
  } {
    // Determine market condition
    const random = Math.random();
    let marketMultiplier = 1.0;
    let cumulativeProbability = 0;

    for (const condition of MARKET_CONDITIONS) {
      cumulativeProbability += condition.probability;
      if (random <= cumulativeProbability) {
        marketMultiplier = condition.yieldMultiplier;
        break;
      }
    }

    // Add day of week factor (lower yields on weekends)
    const dayOfWeek = date.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.8 : 1.0;

    // Generate yields with volatility
    const aaveYield = this.generateYieldWithVolatility(
      // Use Aave instead of Benqi
      HISTORICAL_YIELDS.aave,
      marketMultiplier * weekendFactor
    );
    const traderJoeYield = this.generateYieldWithVolatility(
      HISTORICAL_YIELDS.traderJoe,
      marketMultiplier * weekendFactor
    );
    const yieldYakYield = this.generateYieldWithVolatility(
      HISTORICAL_YIELDS.yieldYak,
      marketMultiplier * weekendFactor
    );

    return {
      aave: aaveYield / 365, // Convert annual to daily (Use Aave instead of Benqi)
      traderJoe: traderJoeYield / 365,
      yieldYak: yieldYakYield / 365,
    };
  }

  /**
   * Generate yield with volatility
   */
  private generateYieldWithVolatility(
    yieldConfig: { base: number; volatility: number; trend: number },
    marketMultiplier: number
  ): number {
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const volatilityImpact = randomFactor * yieldConfig.volatility;
    const trendImpact = Math.random() * yieldConfig.trend;

    return (
      (yieldConfig.base + volatilityImpact + trendImpact) * marketMultiplier
    );
  }

  /**
   * Calculate daily portfolio return
   */
  private calculateDailyReturn(
    portfolioValue: number,
    allocation: AllocationStrategy,
    dailyYields: { aave: number; traderJoe: number; yieldYak: number }
  ): number {
    const aaveValue = portfolioValue * ((allocation.aave || 0) / 100); // Use Aave instead of Benqi
    const traderJoeValue = portfolioValue * (allocation.traderJoe / 100);
    const yieldYakValue = portfolioValue * (allocation.yieldYak / 100);

    const aaveReturn = aaveValue * (dailyYields.aave / 100);
    const traderJoeReturn = traderJoeValue * (dailyYields.traderJoe / 100);
    const yieldYakReturn = yieldYakValue * (dailyYields.yieldYak / 100);

    return aaveReturn + traderJoeReturn + yieldYakReturn; // Use aaveReturn instead of benqiReturn
  }

  /**
   * Calculate annualized return
   */
  private calculateAnnualizedReturn(
    initialValue: number,
    finalValue: number,
    days: number
  ): number {
    const years = days / 365;
    const totalReturn = finalValue / initialValue;
    return (Math.pow(totalReturn, 1 / years) - 1) * 100;
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(timeline: TimelineEntry[]): {
    volatility: number;
    sharpeRatio: number;
  } {
    if (timeline.length < 2) {
      return { volatility: 0, sharpeRatio: 0 };
    }

    // Calculate daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < timeline.length; i++) {
      const dailyReturn =
        (timeline[i].portfolioValue - timeline[i - 1].portfolioValue) /
        timeline[i - 1].portfolioValue;
      dailyReturns.push(dailyReturn);
    }

    // Calculate average return
    const avgReturn =
      dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

    // Calculate volatility (standard deviation)
    const variance =
      dailyReturns.reduce((sum, r) => {
        return sum + Math.pow(r - avgReturn, 2);
      }, 0) / dailyReturns.length;

    const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized

    // Calculate Sharpe ratio (using 2% risk-free rate)
    const riskFreeRate = 0.02 / 365; // Daily risk-free rate
    const excessReturn = avgReturn - riskFreeRate;
    const sharpeRatio = (excessReturn / Math.sqrt(variance)) * Math.sqrt(365);

    return { volatility, sharpeRatio };
  }

  /**
   * Calculate benchmark comparisons
   */
  private calculateBenchmarks(
    initialAmount: number,
    days: number
  ): BacktestResult["comparisonBenchmark"] {
    // Hold AVAX (assuming 20% annual appreciation)
    const avaxAnnualReturn = 0.2;
    const avaxDailyReturn = avaxAnnualReturn / 365;
    const holdAvax = initialAmount * Math.pow(1 + avaxDailyReturn, days);

    // Hold USDC (no appreciation, just stability)
    const holdUsdc = initialAmount;

    // Traditional savings (2% APY)
    const savingsAnnualReturn = 0.02;
    const savingsDailyReturn = savingsAnnualReturn / 365;
    const traditionalSavings =
      initialAmount * Math.pow(1 + savingsDailyReturn, days);

    return {
      holdAvax,
      holdUsdc,
      traditionalSavings,
    };
  }

  /**
   * Generate mock market data for rebalancing
   */
  private getMockMarketData(yields: any): any[] {
    return [
      {
        protocol: "benqi",
        apy: yields.benqi * 365,
        tvl: "10000000",
        isActive: true,
      },
      {
        protocol: "traderjoe",
        apy: yields.traderJoe * 365,
        tvl: "15000000",
        isActive: true,
      },
      {
        protocol: "yieldyak",
        apy: yields.yieldYak * 365,
        tvl: "5000000",
        isActive: true,
      },
    ];
  }

  /**
   * Run multiple backtests with different parameters
   */
  async runScenarioAnalysis(
    baseParams: BacktestParams,
    scenarios: Array<{ name: string; params: Partial<BacktestParams> }>
  ): Promise<Array<{ name: string; result: BacktestResult }>> {
    const results = [];

    for (const scenario of scenarios) {
      logger.info(`Running scenario: ${scenario.name}`);

      const params = {
        ...baseParams,
        ...scenario.params,
      };

      const result = await this.runBacktest(params);
      results.push({
        name: scenario.name,
        result,
      });
    }

    return results;
  }
}

// Singleton instance
export const backtestingService = new BacktestingService();
