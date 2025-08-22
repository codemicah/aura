import { AaveService } from "./aaveService";
import { logger } from "../utils/logger";

export class YieldUpdateService {
  private aaveService: AaveService;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY_MS = 5 * 60 * 1000; // Update every 5 minutes

  constructor() {
    this.aaveService = new AaveService();
  }

  /**
   * Start periodic yield data updates
   */
  public startPeriodicUpdates(): void {
    logger.info(
      `Starting periodic yield updates every ${
        this.UPDATE_FREQUENCY_MS / 1000
      } seconds...`
    );

    // Initial update
    this.updateYieldData();

    // Set up recurring updates
    this.updateInterval = setInterval(() => {
      this.updateYieldData();
    }, this.UPDATE_FREQUENCY_MS);
  }

  /**
   * Stop periodic updates
   */
  public stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info("Stopped periodic yield updates");
    }
  }

  /**
   * Manually trigger yield data update
   */
  public async updateYieldData(): Promise<void> {
    try {
      logger.info("🔄 Updating yield data...");

      // Fetch latest yield data from Aave and other protocols
      const yieldData = await this.aaveService.fetchRealYieldData();

      logger.info("📊 Latest yield data:", {
        aaveAPY: `${(yieldData.aaveAPY / 100).toFixed(2)}%`,
        traderJoeAPY: `${(yieldData.traderJoeAPY / 100).toFixed(2)}%`,
        yieldYakAPY: `${(yieldData.yieldYakAPY / 100).toFixed(2)}%`,
        lastUpdated: new Date(yieldData.lastUpdated * 1000).toISOString(),
      });

      // Update the smart contract with new yield data
      const success = await this.aaveService.updateContractYields();

      if (success) {
        logger.info("✅ Successfully updated contract with new yield data");
      } else {
        logger.error("❌ Failed to update contract with yield data");
      }
    } catch (error) {
      logger.error("Error updating yield data:", error as Error);
    }
  }

  /**
   * Get current yield update status
   */
  public getUpdateStatus(): { isRunning: boolean; lastUpdate: Date | null } {
    return {
      isRunning: this.updateInterval !== null,
      lastUpdate: new Date(), // In a real implementation, you'd track the actual last update time
    };
  }
}
