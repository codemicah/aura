import { Address } from "viem";
import YieldOptimizerABI from "./YieldOptimizerABI.json";

// Direct environment variable access - simple and working
export const YIELD_OPTIMIZER_ADDRESS = (process.env
  .NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

// YieldOptimizer ABI - Updated with Aave V3 integration
export const YIELD_OPTIMIZER_ABI = YieldOptimizerABI;
// Constants for contract interactions
export const CONTRACT_CONSTANTS = {
  MIN_DEPOSIT: "0.01", // 0.01 AVAX minimum deposit
  BASIS_POINTS: 10000,
  REBALANCE_THRESHOLD: 500, // 5% in basis points

  // Risk score ranges
  RISK_RANGES: {
    CONSERVATIVE: { min: 0, max: 33 },
    BALANCED: { min: 34, max: 66 },
    AGGRESSIVE: { min: 67, max: 100 },
  },

  // Default allocations by risk level
  ALLOCATIONS: {
    CONSERVATIVE: { aave: 70, traderjoe: 30, yieldyak: 0 },
    BALANCED: { aave: 40, traderjoe: 40, yieldyak: 20 },
    AGGRESSIVE: { aave: 20, traderjoe: 30, yieldyak: 50 },
  },
} as const;
