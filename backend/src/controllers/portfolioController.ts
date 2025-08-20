import { Request, Response, NextFunction } from "express";
import { blockchainService } from "../services/blockchain";
import { defiDataService } from "../services/defi";
import { databaseService } from "../services/database";
import { logger } from "../utils/logger";
import { ApiResponse, APIError, ValidationError } from "../types";
import { config } from "../utils/config";

export class PortfolioController {
  /**
   * Get user portfolio data from blockchain
   */
  async getUserPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || config.CHAIN_ID;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      logger.info("Fetching user portfolio", {
        address: address.slice(0, 8) + "...",
        chainId,
      });

      // Check if contract is deployed for this chain
      if (!blockchainService.hasContract(chainId)) {
        const response: ApiResponse = {
          success: false,
          error: `YieldOptimizer contract not deployed on chain ${chainId}. Please deploy the contract first or switch to a supported network.`,
          timestamp: new Date(),
        };
        res.status(503).json(response);
        return;
      }

      // Fetch portfolio data from blockchain
      const portfolio = await blockchainService.getUserPortfolio(
        address,
        chainId
      );

      // Get current market data to calculate USD values
      const avaxPrice = await defiDataService.getAVAXPrice();

      // Calculate USD values
      const totalValueUSD = parseFloat(portfolio.estimatedValue) * avaxPrice;
      const totalDepositedUSD =
        parseFloat(portfolio.profile.totalDeposited) * avaxPrice;

      const response: ApiResponse = {
        success: true,
        data: {
          ...portfolio,
          metrics: {
            totalValueUSD: totalValueUSD.toFixed(2),
            totalDepositedUSD: totalDepositedUSD.toFixed(2),
            totalEarningsUSD: (totalValueUSD - totalDepositedUSD).toFixed(2),
            returnPercentage:
              totalDepositedUSD > 0
                ? (
                    ((totalValueUSD - totalDepositedUSD) / totalDepositedUSD) *
                    100
                  ).toFixed(2)
                : "0.00",
            avaxPrice,
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
   * Get user balance from blockchain
   */
  async getUserBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || config.CHAIN_ID;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      const balance = await blockchainService.getBalance(address, chainId);
      const avaxPrice = await defiDataService.getAVAXPrice();
      const balanceUSD = parseFloat(balance) * avaxPrice;

      const response: ApiResponse = {
        success: true,
        data: {
          balance,
          balanceUSD: balanceUSD.toFixed(2),
          avaxPrice,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rebalance recommendation for user
   */
  async getRebalanceRecommendation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || config.CHAIN_ID;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      // Get recommendation from smart contract
      const recommendation = await blockchainService.getRebalanceRecommendation(
        address,
        chainId
      );

      // Get current yields to explain the recommendation
      const currentYields = await blockchainService.getCurrentYields(chainId);

      // Calculate potential improvement
      const currentPortfolio = await blockchainService.getUserPortfolio(
        address,
        chainId
      );
      const currentAllocation = currentPortfolio.allocation;

      // Simple weighted average APY calculation using Aave instead of Benqi
      const currentAPY =
        (parseFloat(currentAllocation.aaveAmount || "0") * currentYields.aave +
          parseFloat(currentAllocation.traderJoeAmount) *
            currentYields.traderJoe +
          parseFloat(currentAllocation.yieldYakAmount) *
            currentYields.yieldYak) /
        parseFloat(currentPortfolio.estimatedValue);

      const newAPY =
        (parseFloat(recommendation.newAllocation.aave || "0") *
          currentYields.aave +
          parseFloat(recommendation.newAllocation.traderJoe) *
            currentYields.traderJoe +
          parseFloat(recommendation.newAllocation.yieldYak) *
            currentYields.yieldYak) /
        parseFloat(currentPortfolio.estimatedValue);

      const response: ApiResponse = {
        success: true,
        data: {
          ...recommendation,
          currentYields,
          projectedImprovement: {
            currentAPY: currentAPY.toFixed(2),
            newAPY: newAPY.toFixed(2),
            improvementAPY: (newAPY - currentAPY).toFixed(2),
            reason: recommendation.shouldRebalance
              ? "Market conditions favor rebalancing for higher yields"
              : "Current allocation is already optimal",
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
   * Get transaction status
   */
  async getTransactionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { hash } = req.params;
      const chainId = parseInt(req.query.chainId as string) || config.CHAIN_ID;

      if (!hash || hash.length !== 66 || !hash.startsWith("0x")) {
        throw new ValidationError("Invalid transaction hash format", "hash");
      }

      const receipt = await blockchainService.getTransactionReceipt(
        hash,
        chainId
      );

      if (!receipt) {
        const response: ApiResponse = {
          success: true,
          data: {
            status: "pending",
            hash,
            message: "Transaction is still pending confirmation",
          },
          timestamp: new Date(),
        };
        res.json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          status: receipt.status === 1 ? "confirmed" : "failed",
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
          confirmations:
            (await blockchainService.getBlockNumber(chainId)) -
            receipt.blockNumber,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current gas price for transactions
   */
  async getGasPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const chainId = parseInt(req.query.chainId as string) || config.CHAIN_ID;

      const gasPrice = await blockchainService.getGasPrice(chainId);
      const avaxPrice = await defiDataService.getAVAXPrice();
      const gasPriceUSD = parseFloat(gasPrice) * avaxPrice;

      const response: ApiResponse = {
        success: true,
        data: {
          gasPrice,
          gasPriceUSD: gasPriceUSD.toFixed(6),
          chainId,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user transaction history
   */
  async getUserTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      // Get transactions from in-memory store (for demo purposes)
      const transactions = blockchainService.getUserTransactionHistory(
        address,
        limit
      );

      const response: ApiResponse = {
        success: true,
        data: {
          address,
          transactions,
          totalCount: transactions.length,
          limit,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save a new transaction
   */
  async saveTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const { type, amount, hash, status, gasUsed, gasPrice, blockNumber } =
        req.body;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      if (!type || !amount || !hash) {
        throw new ValidationError("Missing required fields", "body");
      }

      // Add transaction to history
      blockchainService.addTransaction({
        type,
        amount,
        hash,
        status: status || "pending",
        gasUsed,
        gasPrice,
        blockNumber,
        address,
      });

      // Create a portfolio snapshot after transaction
      try {
        const portfolio = await blockchainService.getUserPortfolio(
          address,
          config.CHAIN_ID
        );
        const avaxPrice = await defiDataService.getAVAXPrice();

        if (portfolio && parseFloat(portfolio.estimatedValue) > 0) {
          // Get or create user profile
          let profile = await databaseService.getUserProfile(address);
          if (!profile) {
            // Create profile if it doesn't exist
            await databaseService.createUserProfile({
              address,
              riskScore: 50, // Default middle risk
              riskProfile: "Balanced" as const,
              totalDeposited: portfolio.profile?.totalDeposited || "0",
              lastRebalance: new Date(),
              autoRebalance: true,
              preferences: {
                maxSlippage: 0.5,
                minYieldThreshold: 5,
                rebalanceFrequency: 7,
                excludedProtocols: [],
                notificationSettings: {
                  email: false,
                  rebalanceAlerts: true,
                  yieldThresholdAlerts: true,
                  portfolioUpdates: true,
                },
              },
            });
            profile = await databaseService.getUserProfile(address);
          }

          // Create snapshot
          if (profile && profile.id) {
            await databaseService.createPortfolioSnapshot({
              userId: profile.id,
              totalValue: portfolio.estimatedValue,
              aaveAmount: portfolio.allocation.aaveAmount || "0", // Use Aave instead of Benqi
              benqiAmount: "0", // Legacy field, set to 0
              traderJoeAmount: portfolio.allocation.traderJoeAmount,
              yieldYakAmount: portfolio.allocation.yieldYakAmount,
              estimatedAPY: portfolio.estimatedAPY || 0,
              avaxPrice,
            });
          }

          logger.info("Portfolio snapshot created after transaction", {
            address: address.slice(0, 8) + "...",
            type,
            totalValue: portfolio.estimatedValue,
          });
        }
      } catch (snapshotError) {
        // Log error but don't fail the transaction save
        logger.error(
          "Failed to create portfolio snapshot",
          snapshotError as Error
        );
      }

      const response: ApiResponse = {
        success: true,
        data: {
          message: "Transaction saved successfully",
          transaction: {
            type,
            amount,
            hash,
            status: status || "pending",
            address,
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
   * Get portfolio history snapshots
   */
  async getPortfolioHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      logger.info("Fetching portfolio history", {
        address: address.slice(0, 8) + "...",
        days,
      });

      // Get snapshots from database
      let snapshots = await databaseService.getPortfolioSnapshots(
        address,
        days
      );

      // If no snapshots exist, create mock historical data
      if (!snapshots || snapshots.length === 0) {
        try {
          // Try to get current portfolio data
          const portfolio = await blockchainService
            .getUserPortfolio(address, config.CHAIN_ID)
            .catch(() => null);
          const avaxPrice = await defiDataService
            .getAVAXPrice()
            .catch(() => 45); // Default AVAX price

          // Create mock historical data for the past days
          const mockSnapshots = [];
          const currentValue = portfolio
            ? parseFloat(portfolio.estimatedValue || "0")
            : 1000; // Default value if no portfolio

          for (let i = 0; i < days; i++) {
            // Simulate daily variation (-2% to +3%)
            const variation = 1 + (Math.random() * 0.05 - 0.02);
            const dayValue = currentValue * Math.pow(variation, days - i);

            const date = new Date();
            date.setDate(date.getDate() - i);

            mockSnapshots.push({
              snapshotDate: date.toISOString(),
              totalValue: dayValue.toString(),
              aaveAmount: (dayValue * 0.4).toString(), // 40% in Aave (replaces Benqi)
              traderJoeAmount: (dayValue * 0.35).toString(), // 35% in TraderJoe
              yieldYakAmount: (dayValue * 0.25).toString(), // 25% in YieldYak
              avaxPrice: avaxPrice * (1 + (Math.random() * 0.02 - 0.01)), // Small price variation
            });
          }

          snapshots = mockSnapshots.reverse(); // Reverse to have oldest first
        } catch (err) {
          logger.error("Error creating mock snapshots", err as Error);
          snapshots = [];
        }
      }

      // Format snapshots for frontend - ensure snapshots is always an array
      const history = (snapshots || []).map((snapshot) => ({
        date: snapshot.snapshotDate,
        totalValue:
          parseFloat(snapshot.totalValue || "0") * (snapshot.avaxPrice || 45),
        allocation: {
          aave:
            parseFloat(snapshot.aaveAmount || "0") * (snapshot.avaxPrice || 45), // Use Aave instead of Benqi
          traderJoe:
            parseFloat(snapshot.traderJoeAmount || "0") *
            (snapshot.avaxPrice || 45),
          yieldYak:
            parseFloat(snapshot.yieldYakAmount || "0") *
            (snapshot.avaxPrice || 45),
        },
      }));

      // Return the history array directly as the frontend expects
      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user risk profile
   */
  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      logger.info("Fetching user profile", {
        address: address.slice(0, 8) + "...",
      });

      const profile = await databaseService.getUserProfile(address);

      const response: ApiResponse = {
        success: true,
        data: profile || { message: "No profile found for this address" },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save or update user risk profile
   */
  async saveUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const {
        riskScore,
        riskProfile,
        preferences,
        age,
        income,
        expenses,
        goals,
        riskTolerance,
      } = req.body;

      if (!blockchainService.isValidAddress(address)) {
        throw new ValidationError("Invalid Ethereum address", "address");
      }

      if (riskScore === undefined || !riskProfile) {
        throw new ValidationError(
          "Risk score and profile are required",
          "body"
        );
      }

      if (riskScore < 0 || riskScore > 100) {
        throw new ValidationError(
          "Risk score must be between 0 and 100",
          "riskScore"
        );
      }

      logger.info("Saving user profile", {
        address: address.slice(0, 8) + "...",
        riskScore,
        riskProfile,
      });

      // Check if profile exists
      const existingProfile = await databaseService.getUserProfile(address);

      if (existingProfile) {
        // Update existing profile
        await databaseService.updateUserProfile(address, {
          riskScore,
          riskProfile,
          preferences: preferences || {
            age,
            income,
            expenses,
            goals,
            riskTolerance,
          },
        });
      } else {
        // Create new profile
        await databaseService.createUserProfile({
          address,
          riskScore,
          riskProfile,
          totalDeposited: "0",
          lastRebalance: new Date(),
          autoRebalance: true,
          preferences: preferences || {
            age,
            income,
            expenses,
            goals,
            riskTolerance,
          },
        });
      }

      // Fetch updated profile
      const updatedProfile = await databaseService.getUserProfile(address);

      const response: ApiResponse = {
        success: true,
        data: {
          message: existingProfile
            ? "Profile updated successfully"
            : "Profile created successfully",
          profile: updatedProfile,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for blockchain connections
   */
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await blockchainService.healthCheck();
      const protocolData = await defiDataService.getAllProtocolData();

      const allHealthy = Object.values(health).every((status) => status);
      const protocolsActive = protocolData.filter((p) => p.isActive).length;

      const response: ApiResponse = {
        success: allHealthy,
        data: {
          blockchain: health,
          protocols: {
            total: protocolData.length,
            active: protocolsActive,
            data: protocolData,
          },
          status: allHealthy ? "healthy" : "degraded",
        },
        timestamp: new Date(),
      };

      res.status(allHealthy ? 200 : 503).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const portfolioController = new PortfolioController();
