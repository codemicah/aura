import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController";

const router = Router();

// Analytics endpoints
router.get("/metrics/:userId", analyticsController.getPerformanceMetrics);
router.get("/protocols/:userId", analyticsController.getProtocolPerformance);
router.get("/benchmarks/:userId", analyticsController.getBenchmarkComparisons);
router.get("/risk/:userId", analyticsController.getRiskMetrics);
router.get("/dashboard/:userId", analyticsController.getDashboard);

export default router;