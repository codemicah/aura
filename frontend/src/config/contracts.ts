import { Address } from "viem";

// Direct environment variable access - simple and working
export const YIELD_OPTIMIZER_ADDRESS = (process.env
  .NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

export const TRADERJOE_ROUTER_ADDRESS = (process.env
  .NEXT_PUBLIC_TRADERJOE_ROUTER_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

export const BENQI_COMPTROLLER_ADDRESS = (process.env
  .NEXT_PUBLIC_BENQI_COMPTROLLER_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

export const YIELDYAK_FARM_ADDRESS = (process.env
  .NEXT_PUBLIC_YIELDYAK_FARM_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

// YieldOptimizer ABI (will be updated when we have the actual deployed contract)
export const YIELD_OPTIMIZER_ABI = [
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_riskScore",
        type: "uint8",
      },
    ],
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
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "protocol",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAddress",
        type: "address",
      },
    ],
    name: "ProtocolAddressUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalValue",
        type: "uint256",
      },
    ],
    name: "Rebalanced",
    type: "event",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "protocol",
        type: "string",
      },
      {
        internalType: "address",
        name: "newAddress",
        type: "address",
      },
    ],
    name: "updateProtocolAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_benqiAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_traderJoeAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_yieldYakAPY",
        type: "uint256",
      },
    ],
    name: "updateYields",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "riskScore",
        type: "uint8",
      },
    ],
    name: "YieldOptimized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "benqiAPY",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "traderJoeAPY",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "yieldYakAPY",
        type: "uint256",
      },
    ],
    name: "YieldsUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "BASIS_POINTS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "benqiComptroller",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentYields",
    outputs: [
      {
        internalType: "uint256",
        name: "benqiAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "traderJoeAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "yieldYakAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastUpdated",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentYields",
    outputs: [
      {
        internalType: "uint256",
        name: "benqiAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "traderJoeAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "yieldYakAPY",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastUpdated",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getRebalanceRecommendation",
    outputs: [
      {
        internalType: "bool",
        name: "shouldRebalance",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "newBenqiAllocation",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newTraderJoeAllocation",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newYieldYakAllocation",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserPortfolio",
    outputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "riskScore",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "totalDeposited",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastRebalance",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "autoRebalance",
            type: "bool",
          },
        ],
        internalType: "struct YieldOptimizer.UserProfile",
        name: "profile",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "benqiAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "traderJoeAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "yieldYakAmount",
            type: "uint256",
          },
        ],
        internalType: "struct YieldOptimizer.ProtocolAllocation",
        name: "allocation",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "estimatedValue",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_DEPOSIT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "REBALANCE_THRESHOLD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "traderJoeRouter",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userAllocations",
    outputs: [
      {
        internalType: "uint256",
        name: "benqiAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "traderJoeAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "yieldYakAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userProfiles",
    outputs: [
      {
        internalType: "uint8",
        name: "riskScore",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "totalDeposited",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastRebalance",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "autoRebalance",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "yieldYakFarm",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
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
