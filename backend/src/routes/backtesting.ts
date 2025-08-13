import { Router } from "express";
import { backtestingService } from "../services/backtesting";
import { validateRequest } from "../middleware";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Run backtesting simulation
 * POST /api/v1/backtesting/run
 */
router.post(
  "/run",
  validateRequest({
    required: ["initialAmount", "riskScore", "startDate", "endDate"],
  }),
  async (req, res) => {
    try {
      const {
        initialAmount,
        riskScore,
        startDate,
        endDate,
        rebalanceFrequency = 30,
        compoundingEnabled = true,
      } = req.body;

      const result = await backtestingService.runBacktest({
        initialAmount: parseFloat(initialAmount),
        riskScore: parseInt(riskScore),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rebalanceFrequency: parseInt(rebalanceFrequency),
        compoundingEnabled: Boolean(compoundingEnabled),
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Backtesting failed", error as Error);
      res.status(500).json({
        success: false,
        error: "Failed to run backtesting simulation",
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Run scenario analysis with multiple parameters
 * POST /api/v1/backtesting/scenarios
 */
router.post(
  "/scenarios",
  validateRequest({
    required: ["baseParams", "scenarios"],
  }),
  async (req, res) => {
    try {
      const { baseParams, scenarios } = req.body;

      const formattedBaseParams = {
        initialAmount: parseFloat(baseParams.initialAmount),
        riskScore: parseInt(baseParams.riskScore),
        startDate: new Date(baseParams.startDate),
        endDate: new Date(baseParams.endDate),
        rebalanceFrequency: parseInt(baseParams.rebalanceFrequency || 30),
        compoundingEnabled: Boolean(baseParams.compoundingEnabled),
      };

      const results = await backtestingService.runScenarioAnalysis(
        formattedBaseParams,
        scenarios
      );

      res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Scenario analysis failed", error as Error);
      res.status(500).json({
        success: false,
        error: "Failed to run scenario analysis",
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Get predefined scenarios for testing
 * GET /api/v1/backtesting/predefined-scenarios
 */
router.get("/predefined-scenarios", (req, res) => {
  const scenarios = [
    {
      name: "Conservative Monthly",
      params: {
        riskScore: 20,
        rebalanceFrequency: 30,
        compoundingEnabled: true,
      },
    },
    {
      name: "Balanced Quarterly",
      params: {
        riskScore: 50,
        rebalanceFrequency: 90,
        compoundingEnabled: true,
      },
    },
    {
      name: "Aggressive Weekly",
      params: {
        riskScore: 80,
        rebalanceFrequency: 7,
        compoundingEnabled: true,
      },
    },
    {
      name: "No Rebalancing",
      params: {
        riskScore: 50,
        rebalanceFrequency: 365,
        compoundingEnabled: false,
      },
    },
  ];

  res.json({
    success: true,
    data: scenarios,
    timestamp: new Date().toISOString(),
  });
});

// Log backtesting routes registration
logger.info("Backtesting routes registered", {
  routes: [
    "POST /backtesting/run",
    "POST /backtesting/scenarios",
    "GET /backtesting/predefined-scenarios",
  ],
});

export default router;
