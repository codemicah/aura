import { Address } from "viem";

// Direct environment variable access - simple and working
export const YIELD_OPTIMIZER_ADDRESS = (process.env.NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

export const TRADERJOE_ROUTER_ADDRESS = (process.env.NEXT_PUBLIC_TRADERJOE_ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

export const BENQI_COMPTROLLER_ADDRESS = (process.env.NEXT_PUBLIC_BENQI_COMPTROLLER_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

export const YIELDYAK_FARM_ADDRESS = (process.env.NEXT_PUBLIC_YIELDYAK_FARM_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

// YieldOptimizer ABI (will be updated when we have the actual deployed contract)
export const YIELD_OPTIMIZER_ABI = [
  // View functions
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPortfolio",
    outputs: [
      {
        components: [
          { name: "riskScore", type: "uint8" },
          { name: "totalDeposited", type: "uint256" },
          { name: "lastRebalance", type: "uint256" },
          { name: "autoRebalance", type: "bool" },
        ],
        name: "profile",
        type: "tuple",
      },
      {
        components: [
          { name: "benqiAmount", type: "uint256" },
          { name: "traderJoeAmount", type: "uint256" },
          { name: "yieldYakAmount", type: "uint256" },
        ],
        name: "allocation",
        type: "tuple",
      },
      { name: "estimatedValue", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentYields",
    outputs: [
      { name: "benqiAPY", type: "uint256" },
      { name: "traderJoeAPY", type: "uint256" },
      { name: "yieldYakAPY", type: "uint256" },
      { name: "lastUpdated", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getRebalanceRecommendation",
    outputs: [
      { name: "shouldRebalance", type: "bool" },
      { name: "newBenqiAllocation", type: "uint256" },
      { name: "newTraderJoeAllocation", type: "uint256" },
      { name: "newYieldYakAllocation", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // Write functions
  {
    inputs: [{ name: "_riskScore", type: "uint8" }],
    name: "optimizeYield",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "rebalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "riskScore", type: "uint8" },
    ],
    name: "YieldOptimized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "totalValue", type: "uint256" },
    ],
    name: "Rebalanced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "Withdrawn",
    type: "event",
  },
] as const;

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
    CONSERVATIVE: { benqi: 70, traderjoe: 30, yieldyak: 0 },
    BALANCED: { benqi: 40, traderjoe: 40, yieldyak: 20 },
    AGGRESSIVE: { benqi: 20, traderjoe: 30, yieldyak: 50 },
  },
} as const;
