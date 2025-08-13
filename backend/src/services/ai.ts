import { logger } from "../utils/logger";
import { config } from "../utils/config";
import {
  UserProfile,
  AIRecommendation,
  RebalanceRecommendation,
  YieldData,
  APIError,
} from "../types";
import { defiDataService } from "./defi";

// Risk assessment questionnaire data structure
export interface RiskAssessmentAnswers {
  age: number;
  income: number;
  monthlyExpenses: number;
  investmentGoal: "short_term" | "medium_term" | "long_term" | "retirement";
  riskTolerance: "very_low" | "low" | "medium" | "high" | "very_high";
  investmentExperience:
    | "none"
    | "beginner"
    | "intermediate"
    | "advanced"
    | "expert";
  timeHorizon: number; // in years
  liquidityNeed: "high" | "medium" | "low";
}

// Portfolio allocation strategy
export interface AllocationStrategy {
  benqi: number; // Percentage (0-100)
  traderJoe: number;
  yieldYak: number;
  rationale: string;
  expectedAPY: number;
  riskLevel: "low" | "medium" | "high";
}

export class AIService {
  constructor() {
    logger.info("AI Service initialized", {
      aiEnabled: config.ENABLE_AI_RECOMMENDATIONS,
      minPortfolioValue: config.MIN_PORTFOLIO_VALUE_USD,
    });
  }

  /**
   * Calculate comprehensive risk score from user assessment
   * Range: 0-100 (Conservative: 0-33, Balanced: 34-66, Aggressive: 67-100)
   */
  calculateRiskScore(answers: RiskAssessmentAnswers): number {
    const weights = {
      age: 0.2,
      income: 0.15,
      expenses: 0.1,
      goal: 0.15,
      tolerance: 0.25,
      experience: 0.1,
      timeHorizon: 0.05,
    };

    let score = 0;

    // Age factor (younger = higher risk capacity)
    const ageScore = Math.max(0, Math.min(100, (40 - answers.age) * 2 + 50));
    score += ageScore * weights.age;

    // Income factor (higher income = higher risk capacity)
    const incomeScore = Math.min(100, (answers.income / 100000) * 40 + 30);
    score += incomeScore * weights.income;

    // Expense ratio (lower expenses relative to income = higher capacity)
    const expenseRatio = (answers.monthlyExpenses * 12) / answers.income;
    const expenseScore = Math.max(0, 100 - expenseRatio * 100);
    score += expenseScore * weights.expenses;

    // Investment goal (longer term = higher risk capacity)
    const goalScores = {
      short_term: 20,
      medium_term: 45,
      long_term: 70,
      retirement: 80,
    };
    score += goalScores[answers.investmentGoal] * weights.goal;

    // Risk tolerance (direct mapping)
    const toleranceScores = {
      very_low: 10,
      low: 25,
      medium: 50,
      high: 75,
      very_high: 90,
    };
    score += toleranceScores[answers.riskTolerance] * weights.tolerance;

    // Investment experience
    const experienceScores = {
      none: 10,
      beginner: 25,
      intermediate: 50,
      advanced: 75,
      expert: 90,
    };
    score +=
      experienceScores[answers.investmentExperience] * weights.experience;

    // Time horizon (longer = higher risk capacity)
    const timeScore = Math.min(100, (answers.timeHorizon / 20) * 100);
    score += timeScore * weights.timeHorizon;

    // Round and constrain to 0-100
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    logger.ai("Risk score calculated", finalScore / 100, {
      age: answers.age,
      riskTolerance: answers.riskTolerance,
      experience: answers.investmentExperience,
      finalScore,
    });

    return finalScore;
  }

  /**
   * Get risk profile category from score
   */
  getRiskProfile(score: number): "Conservative" | "Balanced" | "Aggressive" {
    if (score <= 33) return "Conservative";
    if (score <= 66) return "Balanced";
    return "Aggressive";
  }

  /**
   * Generate allocation strategy based on risk score and market conditions
   */
  async generateAllocationStrategy(
    riskScore: number,
    currentMarketData?: YieldData[]
  ): Promise<AllocationStrategy> {
    try {
      // Get current market data if not provided
      const marketData =
        currentMarketData || (await defiDataService.getAllProtocolData());

      // Base allocations by risk profile
      const baseAllocations = {
        Conservative: { benqi: 70, traderJoe: 30, yieldYak: 0 },
        Balanced: { benqi: 40, traderJoe: 40, yieldYak: 20 },
        Aggressive: { benqi: 20, traderJoe: 30, yieldYak: 50 },
      };

      const riskProfile = this.getRiskProfile(riskScore);
      let allocation = { ...baseAllocations[riskProfile] };

      // Adjust based on current market conditions
      const benqiData = marketData.find((p) => p.protocol === "benqi");
      const traderJoeData = marketData.find((p) => p.protocol === "traderjoe");
      const yieldYakData = marketData.find((p) => p.protocol === "yieldyak");

      if (benqiData && traderJoeData && yieldYakData) {
        // Calculate yield-adjusted allocation (±10% adjustment based on relative yields)
        const avgYield =
          (benqiData.apy + traderJoeData.apy + yieldYakData.apy) / 3;

        const benqiAdjustment = ((benqiData.apy - avgYield) / avgYield) * 10;
        const traderJoeAdjustment =
          ((traderJoeData.apy - avgYield) / avgYield) * 10;
        const yieldYakAdjustment =
          ((yieldYakData.apy - avgYield) / avgYield) * 10;

        allocation.benqi = Math.max(
          5,
          Math.min(85, allocation.benqi + benqiAdjustment)
        );
        allocation.traderJoe = Math.max(
          5,
          Math.min(85, allocation.traderJoe + traderJoeAdjustment)
        );
        allocation.yieldYak = Math.max(
          0,
          Math.min(80, allocation.yieldYak + yieldYakAdjustment)
        );

        // Normalize to 100%
        const total =
          allocation.benqi + allocation.traderJoe + allocation.yieldYak;
        allocation.benqi = (allocation.benqi / total) * 100;
        allocation.traderJoe = (allocation.traderJoe / total) * 100;
        allocation.yieldYak = (allocation.yieldYak / total) * 100;
      }

      // Calculate expected APY
      const expectedAPY =
        allocation.benqi * (benqiData?.apy || 5.2) +
        allocation.traderJoe * (traderJoeData?.apy || 8.7) +
        allocation.yieldYak * (yieldYakData?.apy || 12.4);

      // Generate rationale
      const rationale = this.generateAllocationRationale(
        riskProfile,
        allocation,
        marketData
      );

      const strategy: AllocationStrategy = {
        benqi: Math.round(allocation.benqi),
        traderJoe: Math.round(allocation.traderJoe),
        yieldYak: Math.round(allocation.yieldYak),
        rationale,
        expectedAPY: expectedAPY / 100,
        riskLevel: riskProfile === "Conservative" ? "low" : 
                   riskProfile === "Balanced" ? "medium" : 
                   riskProfile === "Aggressive" ? "high" : "low",
      };

      logger.ai("Allocation strategy generated", strategy.expectedAPY, {
        riskScore,
        riskProfile,
        allocation: strategy,
      });

      return strategy;
    } catch (error) {
      logger.error("Failed to generate allocation strategy", error as Error);

      // Fallback to default allocation
      const defaultAllocations = {
        Conservative: {
          benqi: 70,
          traderJoe: 30,
          yieldYak: 0,
          expectedAPY: 0.065,
          riskLevel: "low" as const,
        },
        Balanced: {
          benqi: 40,
          traderJoe: 40,
          yieldYak: 20,
          expectedAPY: 0.088,
          riskLevel: "medium" as const,
        },
        Aggressive: {
          benqi: 20,
          traderJoe: 30,
          yieldYak: 50,
          expectedAPY: 0.112,
          riskLevel: "high" as const,
        },
      };

      const riskProfile = this.getRiskProfile(riskScore);
      const fallback = defaultAllocations[riskProfile];

      return {
        ...fallback,
        rationale: `Using default ${riskProfile} allocation due to market data unavailability.`,
      };
    }
  }

  /**
   * Generate human-readable rationale for allocation strategy
   */
  private generateAllocationRationale(
    riskProfile: string,
    allocation: { benqi: number; traderJoe: number; yieldYak: number },
    marketData: YieldData[]
  ): string {
    const benqiAPY = marketData.find((p) => p.protocol === "benqi")?.apy || 5.2;
    const traderJoeAPY =
      marketData.find((p) => p.protocol === "traderjoe")?.apy || 8.7;
    const yieldYakAPY =
      marketData.find((p) => p.protocol === "yieldyak")?.apy || 12.4;

    let rationale = `This ${riskProfile} allocation strategy `;

    if (allocation.benqi >= 50) {
      rationale += `prioritizes stability with ${
        allocation.benqi
      }% in Benqi lending (${benqiAPY.toFixed(1)}% APY), `;
    }

    if (allocation.traderJoe >= 30) {
      rationale += `includes ${
        allocation.traderJoe
      }% in TraderJoe LP for balanced risk-reward (${traderJoeAPY.toFixed(
        1
      )}% APY), `;
    }

    if (allocation.yieldYak > 0) {
      rationale += `and allocates ${
        allocation.yieldYak
      }% to YieldYak farming for higher yields (${yieldYakAPY.toFixed(
        1
      )}% APY). `;
    } else {
      rationale += `and avoids high-risk farming protocols. `;
    }

    rationale += `This allocation is optimized for your risk profile while considering current market yields.`;

    return rationale;
  }

  /**
   * Calculate surplus available for investment
   */
  calculateSurplus(
    monthlyIncome: number,
    monthlyExpenses: number,
    emergencyFundTarget: number = 6, // months
    currentEmergencyFund: number = 0
  ): {
    monthlySurplus: number;
    emergencyFundNeeded: number;
    investableAmount: number;
    recommendedInvestmentPercentage: number;
  } {
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const emergencyFundNeeded = Math.max(
      0,
      monthlyExpenses * emergencyFundTarget - currentEmergencyFund
    );

    // Reserve emergency fund first, then calculate investable amount
    let investableAmount = monthlySurplus;

    if (emergencyFundNeeded > 0) {
      // Allocate 50% of surplus to emergency fund until target is reached
      const emergencyFundAllocation = Math.min(
        monthlySurplus * 0.5,
        emergencyFundNeeded
      );
      investableAmount = monthlySurplus - emergencyFundAllocation;
    }

    // Recommended investment percentage of surplus (conservative approach)
    const recommendedInvestmentPercentage = Math.min(
      80,
      Math.max(
        20,
        monthlySurplus > 0 ? (investableAmount / monthlySurplus) * 100 : 0
      )
    );

    const result = {
      monthlySurplus: Math.max(0, monthlySurplus),
      emergencyFundNeeded,
      investableAmount: Math.max(0, investableAmount),
      recommendedInvestmentPercentage,
    };

    logger.ai("Surplus calculation completed", result.investableAmount / 1000, {
      monthlyIncome,
      monthlyExpenses,
      ...result,
    });

    return result;
  }

  /**
   * Generate investment recommendations based on user profile and market conditions
   */
  async generateInvestmentRecommendation(
    userProfile: UserProfile,
    currentPortfolioValue: number = 0,
    monthlyIncome?: number,
    monthlyExpenses?: number
  ): Promise<AIRecommendation> {
    try {
      const marketData = await defiDataService.getAllProtocolData();
      const allocation = await this.generateAllocationStrategy(
        userProfile.riskScore,
        marketData
      );

      // Calculate surplus if financial data provided
      let surplusData = null;
      if (monthlyIncome && monthlyExpenses) {
        surplusData = this.calculateSurplus(monthlyIncome, monthlyExpenses);
      }

      // Determine recommendation type and amount
      let recommendationType: AIRecommendation["type"] = "yield_opportunity";
      let title = "Yield Optimization Opportunity";
      let description =
        "Market conditions present opportunities for yield optimization.";
      let confidence = 0.7;
      let expectedReturn = allocation.expectedAPY;

      // Portfolio value based recommendations
      if (currentPortfolioValue < config.MIN_PORTFOLIO_VALUE_USD) {
        recommendationType = "deposit";
        title = "Initial Investment Recommended";
        description = `Consider making an initial investment of at least $${config.MIN_PORTFOLIO_VALUE_USD} to start optimizing yields across Avalanche DeFi protocols.`;
        confidence = 0.8;
      } else if (surplusData && surplusData.investableAmount > 100) {
        recommendationType = "deposit";
        title = "Regular Investment Opportunity";
        description = `Based on your monthly surplus of $${surplusData.investableAmount.toFixed(
          0
        )}, consider increasing your DeFi investment allocation.`;
        confidence = 0.75;
      }

      // Rebalancing recommendation
      const shouldRebalance = await this.shouldRebalance(
        userProfile,
        currentPortfolioValue,
        allocation
      );
      if (shouldRebalance.shouldRebalance) {
        recommendationType = "rebalance";
        title = "Portfolio Rebalancing Recommended";
        description = shouldRebalance.reason;
        confidence = shouldRebalance.confidence;
      }

      const recommendation: AIRecommendation = {
        userId: userProfile.id,
        type: recommendationType,
        title,
        description,
        confidence,
        expectedReturn: expectedReturn * 100, // Convert to percentage
        riskLevel: allocation.riskLevel,
        actionData: {
          allocation,
          surplusData,
          marketData: marketData.map((m) => ({
            protocol: m.protocol,
            apy: m.apy,
            isActive: m.isActive,
          })),
        },
        createdAt: new Date(),
      };

      logger.ai("Investment recommendation generated", confidence, {
        userId: userProfile.id,
        type: recommendationType,
        portfolioValue: currentPortfolioValue,
      });

      return recommendation;
    } catch (error) {
      logger.error(
        "Failed to generate investment recommendation",
        error as Error
      );
      throw new APIError("Failed to generate investment recommendation");
    }
  }

  /**
   * Determine if portfolio should be rebalanced
   */
  private async shouldRebalance(
    userProfile: UserProfile,
    currentPortfolioValue: number,
    targetAllocation: AllocationStrategy
  ): Promise<{ shouldRebalance: boolean; reason: string; confidence: number }> {
    // Time-based rebalancing (if last rebalance > 30 days ago)
    const daysSinceRebalance = Math.floor(
      (Date.now() - userProfile.lastRebalance.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceRebalance >= 30) {
      return {
        shouldRebalance: true,
        reason: `It has been ${daysSinceRebalance} days since your last rebalance. Regular rebalancing helps maintain optimal risk/return profile.`,
        confidence: 0.8,
      };
    }

    // Market condition based rebalancing would require current allocation data
    // This would typically compare current allocation vs target allocation
    // For now, we'll use a simplified approach

    if (currentPortfolioValue >= config.MIN_PORTFOLIO_VALUE_USD) {
      return {
        shouldRebalance: true,
        reason:
          "Current market yields suggest rebalancing could improve your portfolio performance.",
        confidence: 0.6,
      };
    }

    return {
      shouldRebalance: false,
      reason:
        "Current portfolio allocation is optimal based on your risk profile and market conditions.",
      confidence: 0.7,
    };
  }

  /**
   * Learning system: Analyze user behavior and update preferences
   */
  async updateUserPreferencesFromBehavior(
    userId: string,
    actions: { type: string; timestamp: Date; successful: boolean }[]
  ): Promise<Partial<UserProfile["preferences"]>> {
    // Simple learning based on user actions
    const recentActions = actions.filter(
      (action) =>
        Date.now() - action.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
    );

    const preferences: Partial<UserProfile["preferences"]> = {};

    // Analyze rebalancing frequency
    const rebalanceActions = recentActions.filter(
      (a) => a.type === "rebalance"
    );
    if (rebalanceActions.length > 0) {
      const avgTimeBetweenRebalances =
        recentActions.length > 1
          ? recentActions.reduce((sum, action, index) => {
              if (index === 0) return sum;
              return (
                sum +
                (action.timestamp.getTime() -
                  recentActions[index - 1].timestamp.getTime())
              );
            }, 0) /
            (recentActions.length - 1) /
            (24 * 60 * 60 * 1000) // Convert to days
          : 30;

      preferences.rebalanceFrequency = Math.round(avgTimeBetweenRebalances);
    }

    // Analyze risk behavior (simplified)
    const successfulActions = recentActions.filter((a) => a.successful);
    const successRate = successfulActions.length / recentActions.length;

    if (successRate < 0.7) {
      preferences.maxSlippage = Math.max(
        0.5,
        (preferences.maxSlippage || 2) - 0.5
      );
    }

    logger.ai("User preferences updated from behavior", successRate, {
      userId,
      actionsAnalyzed: recentActions.length,
      preferences,
    });

    return preferences;
  }
}

// Singleton instance
export const aiService = new AIService();
