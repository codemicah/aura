import { logger } from "../utils/logger";
import { config } from "../utils/config";
import { aiService } from "./ai";
import { defiDataService } from "./defi";
import { databaseService } from "./database";
import { blockchainService } from "./blockchain";
import { UserProfile } from "../types";

export interface RebalanceRule {
  type: "time" | "threshold" | "performance" | "market";
  condition: any;
  priority: number;
}

export interface AutoRebalanceConfig {
  enabled: boolean;
  checkInterval: number; // minutes
  rules: RebalanceRule[];
  gasLimit: string;
  maxSlippage: number;
}

export interface RebalanceDecision {
  shouldRebalance: boolean;
  reason: string;
  urgency: "low" | "medium" | "high";
  newAllocation?: {
    benqi: number;
    traderJoe: number;
    yieldYak: number;
  };
  estimatedGasCost?: string;
  expectedImprovement?: number;
}

export class AutoRebalanceService {
  private rebalanceTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastChecks: Map<string, Date> = new Map();

  constructor() {
    logger.info("Auto-rebalance Service initialized");
    this.startPeriodicCheck();
  }

  /**
   * Start periodic check for all users with auto-rebalance enabled
   */
  private startPeriodicCheck() {
    setInterval(async () => {
      try {
        await this.checkAllUsersForRebalance();
      } catch (error) {
        logger.error("Periodic rebalance check failed", error as Error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Check all users for potential rebalancing
   */
  private async checkAllUsersForRebalance() {
    // In production, this would query all users with autoRebalance enabled
    logger.debug("Running periodic rebalance check for all users");
  }

  /**
   * Evaluate if a user's portfolio should be rebalanced
   */
  async evaluateRebalanceDecision(
    userProfile: UserProfile,
    currentAllocation: {
      benqi: number;
      traderJoe: number;
      yieldYak: number;
    }
  ): Promise<RebalanceDecision> {
    const decisions: RebalanceDecision[] = [];

    // Check time-based rule
    const timeSinceLastRebalance =
      Date.now() - userProfile.lastRebalance.getTime();
    const daysSinceRebalance = timeSinceLastRebalance / (1000 * 60 * 60 * 24);

    if (
      daysSinceRebalance >= (userProfile.preferences?.rebalanceFrequency || 30)
    ) {
      decisions.push({
        shouldRebalance: true,
        reason: `It has been ${Math.floor(
          daysSinceRebalance
        )} days since last rebalance`,
        urgency: daysSinceRebalance > 60 ? "high" : "medium",
      });
    }

    // Check allocation drift threshold
    const targetAllocation = await aiService.generateAllocationStrategy(
      userProfile.riskScore
    );
    const driftAnalysis = this.calculateAllocationDrift(
      currentAllocation,
      targetAllocation
    );

    if (driftAnalysis.maxDrift > 10) {
      // 10% drift threshold
      decisions.push({
        shouldRebalance: true,
        reason: `Portfolio allocation has drifted ${driftAnalysis.maxDrift.toFixed(
          1
        )}% from target`,
        urgency: driftAnalysis.maxDrift > 20 ? "high" : "medium",
        newAllocation: {
          benqi: targetAllocation.benqi,
          traderJoe: targetAllocation.traderJoe,
          yieldYak: targetAllocation.yieldYak,
        },
      });
    }

    // Check market opportunity
    const marketOpportunity = await this.evaluateMarketOpportunity(
      userProfile,
      currentAllocation
    );
    if (marketOpportunity.shouldRebalance) {
      decisions.push(marketOpportunity);
    }

    // Check performance-based rebalancing
    const performanceAnalysis = await this.evaluatePerformance(
      userProfile,
      currentAllocation
    );
    if (performanceAnalysis.shouldRebalance) {
      decisions.push(performanceAnalysis);
    }

    // Select highest priority decision
    if (decisions.length === 0) {
      return {
        shouldRebalance: false,
        reason: "Portfolio is optimally balanced",
        urgency: "low",
      };
    }

    // Sort by urgency and return highest priority
    const priorityMap = { high: 3, medium: 2, low: 1 };
    decisions.sort((a, b) => priorityMap[b.urgency] - priorityMap[a.urgency]);

    const finalDecision = decisions[0];

    // Add gas cost estimation
    if (finalDecision.shouldRebalance) {
      finalDecision.estimatedGasCost = await this.estimateGasCost();
    }

    logger.info("Rebalance decision made", {
      userId: userProfile.id,
      shouldRebalance: finalDecision.shouldRebalance,
      reason: finalDecision.reason,
      urgency: finalDecision.urgency,
    });

    return finalDecision;
  }

  /**
   * Calculate allocation drift from target
   */
  private calculateAllocationDrift(
    current: { benqi: number; traderJoe: number; yieldYak: number },
    target: { benqi: number; traderJoe: number; yieldYak: number }
  ): {
    maxDrift: number;
    drifts: { benqi: number; traderJoe: number; yieldYak: number };
  } {
    const drifts = {
      benqi: Math.abs(current.benqi - target.benqi),
      traderJoe: Math.abs(current.traderJoe - target.traderJoe),
      yieldYak: Math.abs(current.yieldYak - target.yieldYak),
    };

    const maxDrift = Math.max(drifts.benqi, drifts.traderJoe, drifts.yieldYak);

    return { maxDrift, drifts };
  }

  /**
   * Evaluate market opportunities for rebalancing
   */
  private async evaluateMarketOpportunity(
    userProfile: UserProfile,
    currentAllocation: any
  ): Promise<RebalanceDecision> {
    const marketData = await defiDataService.getAllProtocolData();

    // Calculate current weighted APY
    const currentAPY =
      currentAllocation.benqi *
        (marketData.find((m) => m.protocol === "benqi")?.apy || 5.2) +
      currentAllocation.traderJoe *
        (marketData.find((m) => m.protocol === "traderjoe")?.apy || 8.7) +
      currentAllocation.yieldYak *
        (marketData.find((m) => m.protocol === "yieldyak")?.apy || 12.4);

    // Generate optimal allocation for current market
    const optimalAllocation = await aiService.generateAllocationStrategy(
      userProfile.riskScore,
      marketData
    );

    const optimalAPY = optimalAllocation.expectedAPY * 10000; // Convert to basis points

    const apyImprovement = optimalAPY - currentAPY;

    if (apyImprovement > 100) {
      // 1% APY improvement threshold
      return {
        shouldRebalance: true,
        reason: `Market conditions present ${(apyImprovement / 100).toFixed(
          2
        )}% APY improvement opportunity`,
        urgency: apyImprovement > 300 ? "high" : "medium",
        newAllocation: {
          benqi: optimalAllocation.benqi,
          traderJoe: optimalAllocation.traderJoe,
          yieldYak: optimalAllocation.yieldYak,
        },
        expectedImprovement: apyImprovement / 100,
      };
    }

    return {
      shouldRebalance: false,
      reason: "No significant market opportunity",
      urgency: "low",
    };
  }

  /**
   * Evaluate performance-based rebalancing
   */
  private async evaluatePerformance(
    userProfile: UserProfile,
    currentAllocation: any
  ): Promise<RebalanceDecision> {
    // Simple performance check - in production would analyze historical returns
    const riskProfile = userProfile.riskProfile;

    // Check if current allocation matches risk profile
    if (riskProfile === "Conservative" && currentAllocation.yieldYak > 20) {
      return {
        shouldRebalance: true,
        reason: "High-risk allocation detected for conservative profile",
        urgency: "high",
      };
    }

    if (riskProfile === "Aggressive" && currentAllocation.benqi > 50) {
      return {
        shouldRebalance: true,
        reason: "Low-yield allocation detected for aggressive profile",
        urgency: "medium",
      };
    }

    return {
      shouldRebalance: false,
      reason: "Performance is within expected parameters",
      urgency: "low",
    };
  }

  /**
   * Estimate gas cost for rebalancing
   */
  private async estimateGasCost(): Promise<string> {
    try {
      const gasPrice = await blockchainService.getGasPrice();
      // Estimate ~300k gas for rebalancing
      const estimatedGas = 300000n;
      const gasCost = (BigInt(gasPrice) * estimatedGas) / 10n ** 18n;
      return gasCost.toString();
    } catch (error) {
      logger.error("Failed to estimate gas cost", error as Error);
      return "0.5"; // Default estimate
    }
  }

  /**
   * Execute automatic rebalancing
   */
  async executeAutoRebalance(
    userAddress: string,
    newAllocation: {
      benqi: number;
      traderJoe: number;
      yieldYak: number;
    }
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      logger.info("Executing auto-rebalance", {
        userAddress,
        newAllocation,
      });

      // In production, this would call the smart contract
      // For now, return mock transaction hash
      const txHash = `0x${Math.random().toString(16).slice(2, 66)}`;

      // Update user's last rebalance time
      await databaseService.updateUserProfile(userAddress, {
        lastRebalance: new Date(),
      });

      logger.info("Auto-rebalance executed successfully", {
        userAddress,
        txHash,
      });

      return { success: true, txHash };
    } catch (error) {
      logger.error("Auto-rebalance execution failed", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Set up automated rebalancing for a user
   */
  async setupAutoRebalance(
    userAddress: string,
    config: AutoRebalanceConfig
  ): Promise<void> {
    if (!config.enabled) {
      this.disableAutoRebalance(userAddress);
      return;
    }

    // Clear existing timer if any
    this.disableAutoRebalance(userAddress);

    // Set up new timer
    const timer = setInterval(async () => {
      try {
        const userProfile = await databaseService.getUserProfile(userAddress);
        if (!userProfile || !userProfile.autoRebalance) {
          this.disableAutoRebalance(userAddress);
          return;
        }

        // Get current allocation from blockchain
        const currentAllocation = await blockchainService.getUserPortfolio(
          userAddress
        );

        // Evaluate rebalance decision
        const decision = await this.evaluateRebalanceDecision(userProfile, {
          benqi: Number(currentAllocation.allocation.benqiPercentage),
          traderJoe: Number(currentAllocation.allocation.traderJoePercentage),
          yieldYak: Number(currentAllocation.allocation.yieldYakPercentage),
        });

        if (decision.shouldRebalance && decision.newAllocation) {
          await this.executeAutoRebalance(userAddress, decision.newAllocation);
        }
      } catch (error) {
        logger.error("Auto-rebalance check failed", error as Error);
      }
    }, config.checkInterval * 60 * 1000);

    this.rebalanceTimers.set(userAddress, timer);
    this.lastChecks.set(userAddress, new Date());

    logger.info("Auto-rebalance enabled for user", {
      userAddress,
      checkInterval: config.checkInterval,
    });
  }

  /**
   * Disable automated rebalancing for a user
   */
  disableAutoRebalance(userAddress: string): void {
    const timer = this.rebalanceTimers.get(userAddress);
    if (timer) {
      clearInterval(timer);
      this.rebalanceTimers.delete(userAddress);
      this.lastChecks.delete(userAddress);

      logger.info("Auto-rebalance disabled for user", { userAddress });
    }
  }

  /**
   * Get auto-rebalance status for a user
   */
  getAutoRebalanceStatus(userAddress: string): {
    enabled: boolean;
    lastCheck?: Date;
    nextCheck?: Date;
  } {
    const enabled = this.rebalanceTimers.has(userAddress);
    const lastCheck = this.lastChecks.get(userAddress);

    return {
      enabled,
      lastCheck,
      nextCheck: lastCheck
        ? new Date(lastCheck.getTime() + 5 * 60 * 1000)
        : undefined,
    };
  }

  /**
   * Cleanup on service shutdown
   */
  cleanup(): void {
    this.rebalanceTimers.forEach((timer) => clearInterval(timer));
    this.rebalanceTimers.clear();
    this.lastChecks.clear();
    logger.info("Auto-rebalance service cleaned up");
  }
}

// Singleton instance
export const autoRebalanceService = new AutoRebalanceService();

// Cleanup on process exit
process.on("SIGINT", () => autoRebalanceService.cleanup());
process.on("SIGTERM", () => autoRebalanceService.cleanup());
