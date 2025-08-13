import { logger } from "../utils/logger";
import { databaseService } from "./database";

export interface PerformanceMetrics {
  totalValue: number;
  totalDeposited: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
  bestDay: {
    date: Date;
    return: number;
  };
  worstDay: {
    date: Date;
    return: number;
  };
}

export interface ProtocolPerformance {
  protocol: string;
  currentValue: number;
  totalDeposited: number;
  totalReturn: number;
  returnPercentage: number;
  currentAPY: number;
  averageAPY: number;
  allocation: number;
  gasFeesSpent: number;
}

export interface BenchmarkComparison {
  strategy: string;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  outperformance: number;
}

export class AnalyticsService {
  constructor() {
    logger.info("Analytics Service initialized");
  }

  /**
   * Calculate comprehensive performance metrics for a user
   */
  async calculatePerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    try {
      // Get portfolio snapshots
      const snapshots = await this.getPortfolioSnapshots(userId);
      
      if (snapshots.length === 0) {
        throw new Error("No portfolio data available");
      }

      // Calculate returns
      const latestSnapshot = snapshots[0];
      const firstSnapshot = snapshots[snapshots.length - 1];
      const totalDeposited = await this.getTotalDeposited(userId);
      
      const totalValue = parseFloat(latestSnapshot.total_value);
      const totalReturn = totalValue - totalDeposited;
      const totalReturnPercentage = (totalReturn / totalDeposited) * 100;

      // Daily return
      const oneDayAgo = snapshots.find((s: any) => {
        const diff = Date.now() - new Date(s.snapshot_date).getTime();
        return diff >= 24 * 60 * 60 * 1000 && diff < 48 * 60 * 60 * 1000;
      });
      const dailyReturn = oneDayAgo 
        ? ((totalValue - parseFloat(oneDayAgo.total_value)) / parseFloat(oneDayAgo.total_value)) * 100
        : 0;

      // Weekly return
      const oneWeekAgo = snapshots.find((s: any) => {
        const diff = Date.now() - new Date(s.snapshot_date).getTime();
        return diff >= 7 * 24 * 60 * 60 * 1000 && diff < 8 * 24 * 60 * 60 * 1000;
      });
      const weeklyReturn = oneWeekAgo
        ? ((totalValue - parseFloat(oneWeekAgo.total_value)) / parseFloat(oneWeekAgo.total_value)) * 100
        : 0;

      // Monthly return
      const oneMonthAgo = snapshots.find((s: any) => {
        const diff = Date.now() - new Date(s.snapshot_date).getTime();
        return diff >= 30 * 24 * 60 * 60 * 1000 && diff < 31 * 24 * 60 * 60 * 1000;
      });
      const monthlyReturn = oneMonthAgo
        ? ((totalValue - parseFloat(oneMonthAgo.total_value)) / parseFloat(oneMonthAgo.total_value)) * 100
        : 0;

      // Calculate daily returns for advanced metrics
      const dailyReturns: number[] = [];
      for (let i = 1; i < snapshots.length; i++) {
        const currentValue = parseFloat(snapshots[i - 1].total_value);
        const previousValue = parseFloat(snapshots[i].total_value);
        const dayReturn = ((currentValue - previousValue) / previousValue) * 100;
        dailyReturns.push(dayReturn);
      }

      // Annualized return
      const daysInvested = Math.floor(
        (Date.now() - new Date(firstSnapshot.snapshot_date).getTime()) / (24 * 60 * 60 * 1000)
      );
      const annualizedReturn = (totalReturnPercentage / daysInvested) * 365;

      // Volatility (standard deviation of daily returns)
      const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(365);

      // Sharpe Ratio (assuming risk-free rate of 2%)
      const riskFreeRate = 2;
      const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;

      // Max Drawdown
      const maxDrawdown = this.calculateMaxDrawdown(snapshots);

      // Win rate (percentage of positive days)
      const positiveDays = dailyReturns.filter(r => r > 0).length;
      const winRate = (positiveDays / dailyReturns.length) * 100;

      // Best and worst days
      const bestDayIndex = dailyReturns.indexOf(Math.max(...dailyReturns));
      const worstDayIndex = dailyReturns.indexOf(Math.min(...dailyReturns));

      return {
        totalValue,
        totalDeposited,
        totalReturn,
        totalReturnPercentage,
        dailyReturn,
        weeklyReturn,
        monthlyReturn,
        annualizedReturn,
        sharpeRatio,
        maxDrawdown,
        volatility,
        winRate,
        bestDay: {
          date: new Date(snapshots[bestDayIndex]?.snapshot_date || Date.now()),
          return: dailyReturns[bestDayIndex] || 0
        },
        worstDay: {
          date: new Date(snapshots[worstDayIndex]?.snapshot_date || Date.now()),
          return: dailyReturns[worstDayIndex] || 0
        }
      };
    } catch (error) {
      logger.error("Failed to calculate performance metrics", error as Error);
      throw error;
    }
  }

  /**
   * Get performance breakdown by protocol
   */
  async getProtocolPerformance(userId: string): Promise<ProtocolPerformance[]> {
    try {
      const latestSnapshot = await this.getLatestSnapshot(userId);
      const transactions = await this.getUserTransactions(userId);
      
      if (!latestSnapshot) {
        return [];
      }

      const protocols = [
        { name: "benqi", field: "benqi_amount" },
        { name: "traderjoe", field: "traderjoe_amount" },
        { name: "yieldyak", field: "yieldyak_amount" }
      ];

      const totalValue = parseFloat(latestSnapshot.total_value);
      const marketData = await this.getMarketData();

      return protocols.map(protocol => {
        const currentValue = parseFloat(latestSnapshot[protocol.field] || "0");
        const protocolTransactions = transactions.filter((tx: any) => 
          tx.metadata?.protocol === protocol.name
        );
        
        const totalDeposited = protocolTransactions
          .filter((tx: any) => tx.type === "deposit")
          .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);

        const gasFeesSpent = protocolTransactions
          .reduce((sum: number, tx: any) => {
            if (tx.gas_used && tx.gas_price) {
              return sum + (parseFloat(tx.gas_used) * parseFloat(tx.gas_price) / 1e18);
            }
            return sum;
          }, 0);

        const marketInfo = marketData.find((m: any) => m.protocol === protocol.name);
        const currentAPY = marketInfo?.apy || 0;

        return {
          protocol: protocol.name,
          currentValue,
          totalDeposited,
          totalReturn: currentValue - totalDeposited,
          returnPercentage: totalDeposited > 0 ? ((currentValue - totalDeposited) / totalDeposited) * 100 : 0,
          currentAPY,
          averageAPY: currentAPY, // Simplified - would need historical data for true average
          allocation: (currentValue / totalValue) * 100,
          gasFeesSpent
        };
      });
    } catch (error) {
      logger.error("Failed to get protocol performance", error as Error);
      throw error;
    }
  }

  /**
   * Compare performance against benchmarks
   */
  async getBenchmarkComparisons(userId: string): Promise<BenchmarkComparison[]> {
    try {
      const metrics = await this.calculatePerformanceMetrics(userId);
      const snapshots = await this.getPortfolioSnapshots(userId);
      
      if (snapshots.length === 0) {
        return [];
      }

      // Calculate benchmark performances
      const firstSnapshot = snapshots[snapshots.length - 1];
      const latestSnapshot = snapshots[0];
      const daysInvested = Math.floor(
        (Date.now() - new Date(firstSnapshot.snapshot_date).getTime()) / (24 * 60 * 60 * 1000)
      );

      // AVAX HODL benchmark (assuming AVAX price appreciation)
      const initialAvaxPrice = firstSnapshot.avax_price;
      const currentAvaxPrice = latestSnapshot.avax_price;
      const avaxReturn = ((currentAvaxPrice - initialAvaxPrice) / initialAvaxPrice) * 100;
      const avaxAnnualized = (avaxReturn / daysInvested) * 365;

      // USDC (stable, no return except potential yield)
      const usdcReturn = 0; // Stablecoin
      const usdcAnnualized = 4.5; // Assuming 4.5% from lending

      // Traditional Savings Account
      const savingsReturn = (2.5 / 365) * daysInvested; // 2.5% APY
      const savingsAnnualized = 2.5;

      // S&P 500 ETF equivalent
      const sp500Return = (10 / 365) * daysInvested; // Historical average ~10%
      const sp500Annualized = 10;

      return [
        {
          strategy: "Your DeFi Strategy",
          totalReturn: metrics.totalReturnPercentage,
          annualizedReturn: metrics.annualizedReturn,
          sharpeRatio: metrics.sharpeRatio,
          maxDrawdown: metrics.maxDrawdown,
          outperformance: 0
        },
        {
          strategy: "AVAX HODL",
          totalReturn: avaxReturn,
          annualizedReturn: avaxAnnualized,
          sharpeRatio: avaxAnnualized / 15, // Simplified Sharpe
          maxDrawdown: 25, // Estimated crypto volatility
          outperformance: metrics.annualizedReturn - avaxAnnualized
        },
        {
          strategy: "USDC Lending",
          totalReturn: usdcReturn,
          annualizedReturn: usdcAnnualized,
          sharpeRatio: 2.5, // Low risk, stable returns
          maxDrawdown: 0.5,
          outperformance: metrics.annualizedReturn - usdcAnnualized
        },
        {
          strategy: "Traditional Savings",
          totalReturn: savingsReturn,
          annualizedReturn: savingsAnnualized,
          sharpeRatio: 1.5,
          maxDrawdown: 0,
          outperformance: metrics.annualizedReturn - savingsAnnualized
        },
        {
          strategy: "S&P 500 Index",
          totalReturn: sp500Return,
          annualizedReturn: sp500Annualized,
          sharpeRatio: 0.5,
          maxDrawdown: 15,
          outperformance: metrics.annualizedReturn - sp500Annualized
        }
      ];
    } catch (error) {
      logger.error("Failed to get benchmark comparisons", error as Error);
      throw error;
    }
  }

  /**
   * Get risk-adjusted metrics
   */
  async getRiskMetrics(userId: string): Promise<any> {
    try {
      const metrics = await this.calculatePerformanceMetrics(userId);
      const snapshots = await this.getPortfolioSnapshots(userId);
      
      // Calculate Value at Risk (VaR) - 95% confidence
      const dailyReturns: number[] = [];
      for (let i = 1; i < snapshots.length; i++) {
        const currentValue = parseFloat(snapshots[i - 1].total_value);
        const previousValue = parseFloat(snapshots[i].total_value);
        const dayReturn = ((currentValue - previousValue) / previousValue) * 100;
        dailyReturns.push(dayReturn);
      }

      dailyReturns.sort((a, b) => a - b);
      const var95Index = Math.floor(dailyReturns.length * 0.05);
      const valueAtRisk95 = dailyReturns[var95Index] || 0;

      // Calculate Sortino Ratio (downside deviation)
      const riskFreeRate = 2 / 365; // Daily risk-free rate
      const downsideReturns = dailyReturns.filter(r => r < riskFreeRate);
      const downsideDeviation = this.calculateStandardDeviation(downsideReturns) * Math.sqrt(365);
      const sortinoRatio = (metrics.annualizedReturn - 2) / downsideDeviation;

      // Calculate Calmar Ratio
      const calmarRatio = metrics.maxDrawdown !== 0 
        ? metrics.annualizedReturn / Math.abs(metrics.maxDrawdown)
        : 0;

      return {
        sharpeRatio: metrics.sharpeRatio,
        sortinoRatio,
        calmarRatio,
        valueAtRisk95,
        maxDrawdown: metrics.maxDrawdown,
        volatility: metrics.volatility,
        downsideDeviation,
        beta: 0.8, // Simplified - would need market data for true beta
        alpha: metrics.annualizedReturn - (0.8 * 10), // Assuming market return of 10%
        informationRatio: (metrics.annualizedReturn - 10) / 5 // Simplified tracking error
      };
    } catch (error) {
      logger.error("Failed to calculate risk metrics", error as Error);
      throw error;
    }
  }

  // Helper methods
  private async getPortfolioSnapshots(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM portfolio_snapshots 
        WHERE user_id = ? 
        ORDER BY snapshot_date DESC
      `;
      
      databaseService['db']?.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  private async getLatestSnapshot(userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM portfolio_snapshots 
        WHERE user_id = ? 
        ORDER BY snapshot_date DESC 
        LIMIT 1
      `;
      
      databaseService['db']?.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  private async getTotalDeposited(userId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT SUM(amount) as total FROM transactions 
        WHERE user_id = ? AND type = 'deposit' AND status = 'confirmed'
      `;
      
      databaseService['db']?.get(sql, [userId], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(parseFloat(row?.total || "0"));
        }
      });
    });
  }

  private async getUserTransactions(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM transactions 
        WHERE user_id = ? 
        ORDER BY timestamp DESC
      `;
      
      databaseService['db']?.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  private async getMarketData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM market_data_cache WHERE is_active = 1";
      
      databaseService['db']?.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(snapshots: any[]): number {
    if (snapshots.length === 0) return 0;
    
    let maxValue = 0;
    let maxDrawdown = 0;
    
    // Snapshots are ordered newest to oldest, so reverse for chronological order
    const chronological = [...snapshots].reverse();
    
    for (const snapshot of chronological) {
      const value = parseFloat(snapshot.total_value);
      
      if (value > maxValue) {
        maxValue = value;
      }
      
      const drawdown = ((maxValue - value) / maxValue) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }
}

export const analyticsService = new AnalyticsService();