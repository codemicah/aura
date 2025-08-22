import { Router } from "express";
import { AaveService } from "../services/aaveService";
import { YieldUpdateService } from "../services/yieldUpdateService";
import { logger } from "../utils/logger";

const router = Router();
const aaveService = new AaveService();

/**
 * Get current Aave yield data
 */
router.get("/yields", async (req, res) => {
  try {
    const yieldData = await aaveService.fetchRealYieldData();

    res.json({
      success: true,
      data: {
        aaveAPY: yieldData.aaveAPY / 100, // Convert from basis points to percentage
        traderJoeAPY: yieldData.traderJoeAPY / 100,
        yieldYakAPY: yieldData.yieldYakAPY / 100,
        lastUpdated: new Date(yieldData.lastUpdated * 1000).toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching Aave yields:", error as Error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch yield data",
    });
  }
});

/**
 * Get Aave service status
 */
router.get("/status", (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        aaveService: "running",
        eventListener: "active",
        yieldUpdater: "active",
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error getting Aave status:", error as Error);
    res.status(500).json({
      success: false,
      error: "Failed to get service status",
    });
  }
});

/**
 * Manually trigger yield data update
 */
router.post("/update-yields", async (req, res) => {
  try {
    const success = await aaveService.updateContractYields();

    res.json({
      success,
      message: success
        ? "Yield data updated successfully"
        : "Failed to update yield data",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error updating yields:", error as Error);
    res.status(500).json({
      success: false,
      error: "Failed to update yield data",
    });
  }
});

export default router;
