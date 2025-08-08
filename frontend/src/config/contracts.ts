import { Address } from 'viem'
import { CHAIN_IDS } from './wagmi'

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  [CHAIN_IDS.AVALANCHE]: {
    yieldOptimizer: process.env.NEXT_PUBLIC_YIELD_OPTIMIZER_AVALANCHE as Address,
    traderjoe: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4' as Address,
    benqi: '0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4' as Address,
    yieldyak: '0xC4729E56b831d74bBc18797e0e17A295fA77488c' as Address,
  },
  [CHAIN_IDS.AVALANCHE_FUJI]: {
    yieldOptimizer: process.env.NEXT_PUBLIC_YIELD_OPTIMIZER_FUJI as Address,
    traderjoe: '0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901' as Address,
    benqi: '0xe194c4c5aC32a3C9ffDb358d9Bfd523a0B6d1568' as Address,
    yieldyak: '0x0000000000000000000000000000000000000001' as Address, // Mock for testing
  }
} as const

// YieldOptimizer ABI (will be updated when we have the actual deployed contract)
export const YIELD_OPTIMIZER_ABI = [
  // View functions
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserPortfolio',
    outputs: [
      {
        components: [
          { name: 'riskScore', type: 'uint8' },
          { name: 'totalDeposited', type: 'uint256' },
          { name: 'lastRebalance', type: 'uint256' },
          { name: 'autoRebalance', type: 'bool' }
        ],
        name: 'profile',
        type: 'tuple'
      },
      {
        components: [
          { name: 'benqiAmount', type: 'uint256' },
          { name: 'traderJoeAmount', type: 'uint256' },
          { name: 'yieldYakAmount', type: 'uint256' }
        ],
        name: 'allocation',
        type: 'tuple'
      },
      { name: 'estimatedValue', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentYields',
    outputs: [
      { name: 'benqiAPY', type: 'uint256' },
      { name: 'traderJoeAPY', type: 'uint256' },
      { name: 'yieldYakAPY', type: 'uint256' },
      { name: 'lastUpdated', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getRebalanceRecommendation',
    outputs: [
      { name: 'shouldRebalance', type: 'bool' },
      { name: 'newBenqiAllocation', type: 'uint256' },
      { name: 'newTraderJoeAllocation', type: 'uint256' },
      { name: 'newYieldYakAllocation', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Write functions
  {
    inputs: [{ name: '_riskScore', type: 'uint8' }],
    name: 'optimizeYield',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'rebalance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'riskScore', type: 'uint8' }
    ],
    name: 'YieldOptimized',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'totalValue', type: 'uint256' }
    ],
    name: 'Rebalanced',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Withdrawn',
    type: 'event'
  }
] as const

// Helper function to get contract address for current chain
export function getYieldOptimizerAddress(chainId: number): Address | undefined {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  return addresses?.yieldOptimizer
}

// Helper function to get all protocol addresses for current chain
export function getProtocolAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
}

// Constants for contract interactions
export const CONTRACT_CONSTANTS = {
  MIN_DEPOSIT: '0.01', // 0.01 AVAX minimum deposit
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
  }
} as const

// Token addresses (AVAX native token and common ERC20s)
export const TOKEN_ADDRESSES = {
  [CHAIN_IDS.AVALANCHE]: {
    AVAX: '0x0000000000000000000000000000000000000000' as Address, // Native AVAX
    WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' as Address,
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as Address,
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' as Address,
  },
  [CHAIN_IDS.AVALANCHE_FUJI]: {
    AVAX: '0x0000000000000000000000000000000000000000' as Address, // Native AVAX
    WAVAX: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c' as Address,
    USDC: '0x5425890298aed601595a70AB815c96711a31Bc65' as Address,
    USDT: '0x1d308089a2D1Ced3f1Ce36B1FcaF815b07217be3' as Address,
  }
} as const