import { Request, Response } from "express";
import { analyticsService } from "../services/analytics";
import { logger } from "../utils/logger";

export class AnalyticsController {
  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
          timestamp: new Date()
        });
        return;
      }

      const metrics = await analyticsService.calculatePerformanceMetrics(userId);
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error("Failed to get performance metrics", error as Error);
      res.status(500).json({
        success: false,
        error: "Failed to calculate performance metrics",
        timestamp: new Date()
      });
    }
  }

  /**
   * Get protocol-specific performance
   */
  async getProtocolPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
          timestamp: new Date()
        });
        return;
      }

      const performance = await analyticsService.getProtocolPerformance(userId);
      
      res.json({
        success: true,
        data: performance,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error("Failed to get protocol performance", error as Error);
      res.status(500).json({
        success: false,
        error: "Failed to get protocol performance",
        timestamp: new Date()
      });
    }
  }

  /**
   * Get benchmark comparisons
   */
  async getBenchmarkComparisons(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
          timestamp: new Date()
        });
        return;
      }

      const comparisons = await analyticsService.getBenchmarkComparisons(userId);
      
      res.json({
        success: true,
        data: comparisons,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error("Failed to get benchmark comparisons", error as Error);
      res.status(500).json({
        success: false,
        error: "Failed to get benchmark comparisons",
        timestamp: new Date()
      });
    }
  }

  /**
   * Get risk metrics
   */
  async getRiskMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
          timestamp: new Date()
        });
        return;
      }

      const riskMetrics = await analyticsService.getRiskMetrics(userId);
      
      res.json({
        success: true,
        data: riskMetrics,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error("Failed to get risk metrics", error as Error);
      res.status(500).json({
        success: false,
        error: "Failed to get risk metrics",
        timestamp: new Date()
      });
    }
  }

  /**
   * Get complete analytics dashboard data
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
          timestamp: new Date()
        });
        return;
      }

      // Fetch all analytics data in parallel
      const [metrics, protocols, benchmarks, riskMetrics] = await Promise.all([
        analyticsService.calculatePerformanceMetrics(userId),
        analyticsService.getProtocolPerformance(userId),
        analyticsService.getBenchmarkComparisons(userId),
        analyticsService.getRiskMetrics(userId)
      ]);
      
      res.json({
        success: true,
        data: {
          performanceMetrics: metrics,
          protocolPerformance: protocols,
          benchmarkComparisons: benchmarks,
          riskMetrics
        },
        timestamp: new Date()
      });
    } catch (error) {
      logger.error("Failed to get analytics dashboard", error as Error);
      res.status(500).json({
        success: false,
        error: "Failed to get analytics dashboard",
        timestamp: new Date()
      });
    }
  }
}

export const analyticsController = new AnalyticsController();