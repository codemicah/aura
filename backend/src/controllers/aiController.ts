import { Request, Response, NextFunction } from "express";
import { aiService, RiskAssessmentAnswers } from "../services/ai";
import { databaseService } from "../services/database";
import { logger } from "../utils/logger";
import { ApiResponse, ValidationError, NotFoundError } from "../types";

export class AIController {
  /**
   * Calculate risk score from assessment answers
   */
  async calculateRiskScore(req: Request, res: Response, next: NextFunction) {
    try {
      const answers: RiskAssessmentAnswers = req.body;

      // Validate required fields
      const requiredFields: (keyof RiskAssessmentAnswers)[] = [
        "age",
        "income",
        "monthlyExpenses",
        "investmentGoal",
        "riskTolerance",
        "investmentExperience",
      ];
      const missing = requiredFields.filter(
        (field) => answers[field] === undefined || answers[field] === null
      );

      if (missing.length > 0) {
        throw new ValidationError(
          `Missing required fields: ${missing.join(", ")}`
        );
      }

      // Validate ranges
      if (answers.age < 18 || answers.age > 100) {
        throw new ValidationError("Age must be between 18 and 100");
      }

      if (answers.income < 0 || answers.monthlyExpenses < 0) {
        throw new ValidationError("Income and expenses must be non-negative");
      }

      const riskScore = aiService.calculateRiskScore(answers);
      const riskProfile = aiService.getRiskProfile(riskScore);

      logger.ai("Risk score calculation requested", riskScore / 100, {
        age: answers.age,
        riskProfile,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          riskScore,
          riskProfile,
          questionnaire: answers,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate allocation strategy based on risk score
   */
  async generateAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { riskScore } = req.body;

      if (typeof riskScore !== "number" || riskScore < 0 || riskScore > 100) {
        throw new ValidationError(
          "Risk score must be a number between 0 and 100"
        );
      }

      const strategy = await aiService.generateAllocationStrategy(riskScore);

      logger.ai("Allocation strategy requested", strategy.expectedAPY, {
        riskScore,
        allocation: strategy,
      });

      const response: ApiResponse = {
        success: true,
        data: strategy,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate surplus available for investment
   */
  async calculateSurplus(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        monthlyIncome,
        monthlyExpenses,
        emergencyFundTarget,
        currentEmergencyFund,
      } = req.body;

      if (typeof monthlyIncome !== "number" || monthlyIncome < 0) {
        throw new ValidationError(
          "Monthly income must be a non-negative number"
        );
      }

      if (typeof monthlyExpenses !== "number" || monthlyExpenses < 0) {
        throw new ValidationError(
          "Monthly expenses must be a non-negative number"
        );
      }

      const surplus = aiService.calculateSurplus(
        monthlyIncome,
        monthlyExpenses,
        emergencyFundTarget || 6,
        currentEmergencyFund || 0
      );

      logger.ai(
        "Surplus calculation requested",
        surplus.investableAmount / 1000,
        {
          monthlyIncome,
          monthlyExpenses,
          surplus: surplus.monthlySurplus,
        }
      );

      const response: ApiResponse = {
        success: true,
        data: {
          ...surplus,
          analysis: {
            canInvest: surplus.investableAmount > 0,
            emergencyFundStatus:
              surplus.emergencyFundNeeded > 0 ? "needs_funding" : "adequate",
            recommendation:
              surplus.investableAmount > 100
                ? "Consider investing surplus in DeFi protocols"
                : surplus.emergencyFundNeeded > 0
                ? "Focus on building emergency fund first"
                : "Monitor expenses to create investment surplus",
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
   * Generate personalized investment recommendation
   */
  async generateRecommendation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { address, currentPortfolioValue, monthlyIncome, monthlyExpenses } =
        req.body;

      if (!address) {
        throw new ValidationError("Wallet address is required");
      }

      // Get user profile from database
      const userProfile = await databaseService.getUserProfile(address);
      if (!userProfile) {
        throw new NotFoundError(
          "User profile not found. Please complete risk assessment first."
        );
      }

      const recommendation = await aiService.generateInvestmentRecommendation(
        userProfile,
        currentPortfolioValue || 0,
        monthlyIncome,
        monthlyExpenses
      );

      // Store recommendation in database for learning
      // Note: In a full implementation, you'd save this to the database

      logger.ai(
        "Investment recommendation generated",
        recommendation.confidence,
        {
          userId: userProfile.id,
          type: recommendation.type,
          portfolioValue: currentPortfolioValue || 0,
        }
      );

      const response: ApiResponse = {
        success: true,
        data: {
          recommendation,
          userProfile: {
            riskScore: userProfile.riskScore,
            riskProfile: userProfile.riskProfile,
            lastRebalance: userProfile.lastRebalance,
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
   * Get all risk profiles and their characteristics
   */
  async getRiskProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const profiles = {
        Conservative: {
          range: "0-33",
          description: "Prioritizes capital preservation with lower volatility",
          allocation: { aave: 70, traderJoe: 30, yieldYak: 0 }, // Use Aave instead of Benqi
          expectedAPY: "5.5-6.5%",
          suitableFor: [
            "New investors",
            "Risk-averse individuals",
            "Short-term goals",
          ],
        },
        Balanced: {
          range: "34-66",
          description: "Balances growth potential with moderate risk",
          allocation: { aave: 40, traderJoe: 40, yieldYak: 20 }, // Use Aave instead of Benqi
          expectedAPY: "7.5-9.5%",
          suitableFor: [
            "Medium-term goals",
            "Moderate risk tolerance",
            "Diversified approach",
          ],
        },
        Aggressive: {
          range: "67-100",
          description: "Maximizes growth potential with higher volatility",
          allocation: { aave: 20, traderJoe: 30, yieldYak: 50 }, // Use Aave instead of Benqi
          expectedAPY: "10-13%",
          suitableFor: [
            "Long-term goals",
            "High risk tolerance",
            "Experienced investors",
          ],
        },
      };

      const response: ApiResponse = {
        success: true,
        data: {
          profiles,
          protocols: {
            aave: {
              type: "Lending",
              risk: "Low",
              description:
                "Enterprise-grade lending protocol with stable yields",
            },
            traderJoe: {
              type: "DEX/LP",
              risk: "Medium",
              description: "Liquidity provision rewards",
            },
            yieldYak: {
              type: "Farming",
              risk: "High",
              description: "Auto-compounding strategies",
            },
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
   * Analyze portfolio performance and suggest improvements
   */
  async analyzePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { address, portfolioData } = req.body;

      if (!address) {
        throw new ValidationError("Wallet address is required");
      }

      const userProfile = await databaseService.getUserProfile(address);
      if (!userProfile) {
        throw new NotFoundError("User profile not found");
      }

      // Generate optimal allocation for comparison
      const optimalStrategy = await aiService.generateAllocationStrategy(
        userProfile.riskScore
      );

      // Simple portfolio analysis (in production, this would be more sophisticated)
      const analysis = {
        currentAllocation: portfolioData?.allocation || {
          aave: 0, // Use Aave instead of Benqi
          traderJoe: 0,
          yieldYak: 0,
        },
        optimalAllocation: {
          aave: optimalStrategy.aave, // Use Aave instead of Benqi
          traderJoe: optimalStrategy.traderJoe,
          yieldYak: optimalStrategy.yieldYak,
        },
        performance: {
          currentAPY: portfolioData?.estimatedAPY || 0,
          optimalAPY: optimalStrategy.expectedAPY,
          improvementPotential:
            optimalStrategy.expectedAPY - (portfolioData?.estimatedAPY || 0),
        },
        recommendations: [
          optimalStrategy.rationale,
          "Consider rebalancing to optimize yield potential",
          "Monitor market conditions for better opportunities",
        ],
      };

      logger.ai(
        "Portfolio analysis completed",
        analysis.performance.improvementPotential,
        {
          userId: userProfile.id,
          currentAPY: analysis.performance.currentAPY,
          optimalAPY: analysis.performance.optimalAPY,
        }
      );

      const response: ApiResponse = {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get AI service health and statistics
   */
  async getAIHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = {
        aiEnabled: true, // config.ENABLE_AI_RECOMMENDATIONS
        services: {
          riskScoring: "operational",
          allocationStrategy: "operational",
          surplusCalculation: "operational",
          recommendationEngine: "operational",
          portfolioAnalysis: "operational",
        },
        statistics: {
          supportedRiskProfiles: 3,
          supportedProtocols: 3,
          allocationStrategies: "dynamic",
          learningEnabled: true,
        },
      };

      const response: ApiResponse = {
        success: true,
        data: health,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
