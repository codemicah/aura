import { ethers, JsonRpcProvider, Contract, formatEther, parseEther } from 'ethers'
import { config, getChainConfig, getCurrentChainConfig } from '../utils/config'
import { logger } from '../utils/logger'
import { APIError } from '../types'

// Import ABI from frontend (we'll copy it)
import yieldOptimizerABI from './abis/YieldOptimizer.json'

export class BlockchainService {
  private providers: Map<number, JsonRpcProvider> = new Map()
  private contracts: Map<string, Contract> = new Map()

  constructor() {
    this.initializeProviders()
    this.initializeContracts()
  }

  private initializeProviders(): void {
    try {
      // Mainnet provider
      const mainnetProvider = new JsonRpcProvider(config.AVALANCHE_RPC_URL)
      this.providers.set(43114, mainnetProvider)

      // Fuji testnet provider
      const fujiProvider = new JsonRpcProvider(config.AVALANCHE_FUJI_RPC_URL)
      this.providers.set(43113, fujiProvider)

      logger.info('Blockchain providers initialized')
    } catch (error) {
      logger.error('Failed to initialize blockchain providers', error as Error)
      throw new APIError('Failed to initialize blockchain connection')
    }
  }

  private initializeContracts(): void {
    try {
      const mainnetConfig = getChainConfig(43114)
      const fujiConfig = getChainConfig(43113)

      // Initialize mainnet contract if address is provided
      if (mainnetConfig.contracts.yieldOptimizer) {
        const mainnetProvider = this.getProvider(43114)
        const mainnetContract = new Contract(
          mainnetConfig.contracts.yieldOptimizer,
          yieldOptimizerABI.abi,
          mainnetProvider
        )
        this.contracts.set('mainnet-yield-optimizer', mainnetContract)
      }

      // Initialize Fuji contract if address is provided
      if (fujiConfig.contracts.yieldOptimizer) {
        const fujiProvider = this.getProvider(43113)
        const fujiContract = new Contract(
          fujiConfig.contracts.yieldOptimizer,
          yieldOptimizerABI.abi,
          fujiProvider
        )
        this.contracts.set('fuji-yield-optimizer', fujiContract)
      }

      logger.info('Smart contracts initialized')
    } catch (error) {
      logger.error('Failed to initialize smart contracts', error as Error)
    }
  }

  getProvider(chainId: number = config.CHAIN_ID): JsonRpcProvider {
    const provider = this.providers.get(chainId)
    if (!provider) {
      throw new APIError(`No provider configured for chain ${chainId}`)
    }
    return provider
  }

  getContract(chainId: number = config.CHAIN_ID): Contract {
    const key = chainId === 43114 ? 'mainnet-yield-optimizer' : 'fuji-yield-optimizer'
    const contract = this.contracts.get(key)
    if (!contract) {
      throw new APIError(`No contract deployed for chain ${chainId}. Please deploy the YieldOptimizer contract first.`)
    }
    return contract
  }

  hasContract(chainId: number = config.CHAIN_ID): boolean {
    const key = chainId === 43114 ? 'mainnet-yield-optimizer' : 'fuji-yield-optimizer'
    return this.contracts.has(key)
  }

  async getBlockNumber(chainId: number = config.CHAIN_ID): Promise<number> {
    try {
      const provider = this.getProvider(chainId)
      const blockNumber = await provider.getBlockNumber()
      logger.blockchain('Block number fetched', chainId, { blockNumber })
      return blockNumber
    } catch (error) {
      logger.error('Failed to fetch block number', error as Error, { chainId })
      throw new APIError('Failed to fetch blockchain data')
    }
  }

  async getBalance(address: string, chainId: number = config.CHAIN_ID): Promise<string> {
    try {
      const provider = this.getProvider(chainId)
      const balance = await provider.getBalance(address)
      const balanceEth = formatEther(balance)
      
      logger.blockchain('Balance fetched', chainId, { 
        address: address.slice(0, 8) + '...',
        balance: balanceEth 
      })
      
      return balanceEth
    } catch (error) {
      logger.error('Failed to fetch balance', error as Error, { address, chainId })
      throw new APIError('Failed to fetch wallet balance')
    }
  }

  async getUserPortfolio(address: string, chainId: number = config.CHAIN_ID): Promise<any> {
    try {
      const contract = this.getContract(chainId)
      const portfolio = await contract.getUserPortfolio(address)
      
      logger.blockchain('Portfolio fetched', chainId, { 
        address: address.slice(0, 8) + '...' 
      })
      
      return {
        profile: {
          riskScore: portfolio[0].riskScore,
          totalDeposited: formatEther(portfolio[0].totalDeposited),
          lastRebalance: new Date(Number(portfolio[0].lastRebalance) * 1000),
          autoRebalance: portfolio[0].autoRebalance
        },
        allocation: {
          benqiAmount: formatEther(portfolio[1].benqiAmount),
          traderJoeAmount: formatEther(portfolio[1].traderJoeAmount),
          yieldYakAmount: formatEther(portfolio[1].yieldYakAmount)
        },
        estimatedValue: formatEther(portfolio[2])
      }
    } catch (error) {
      logger.error('Failed to fetch user portfolio', error as Error, { address, chainId })
      throw new APIError('Failed to fetch portfolio data')
    }
  }

  async getCurrentYields(chainId: number = config.CHAIN_ID): Promise<any> {
    try {
      const contract = this.getContract(chainId)
      const yields = await contract.getCurrentYields()
      
      logger.blockchain('Yields fetched', chainId)
      
      return {
        benqi: Number(yields[0]) / 100, // Convert from basis points
        traderJoe: Number(yields[1]) / 100,
        yieldYak: Number(yields[2]) / 100,
        lastUpdated: new Date(Number(yields[3]) * 1000)
      }
    } catch (error) {
      logger.error('Failed to fetch current yields', error as Error, { chainId })
      throw new APIError('Failed to fetch yield data')
    }
  }

  async getRebalanceRecommendation(address: string, chainId: number = config.CHAIN_ID): Promise<any> {
    try {
      const contract = this.getContract(chainId)
      const recommendation = await contract.getRebalanceRecommendation(address)
      
      logger.blockchain('Rebalance recommendation fetched', chainId, { 
        address: address.slice(0, 8) + '...' 
      })
      
      return {
        shouldRebalance: recommendation[0],
        newAllocation: {
          benqi: formatEther(recommendation[1]),
          traderJoe: formatEther(recommendation[2]),
          yieldYak: formatEther(recommendation[3])
        }
      }
    } catch (error) {
      logger.error('Failed to fetch rebalance recommendation', error as Error, { address, chainId })
      throw new APIError('Failed to fetch rebalance recommendation')
    }
  }

  async getTransactionReceipt(hash: string, chainId: number = config.CHAIN_ID): Promise<any> {
    try {
      const provider = this.getProvider(chainId)
      const receipt = await provider.getTransactionReceipt(hash)
      
      if (receipt) {
        logger.transaction(hash, receipt.status === 1 ? 'confirmed' : 'failed', {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        })
      }
      
      return receipt
    } catch (error) {
      logger.error('Failed to fetch transaction receipt', error as Error, { hash, chainId })
      throw new APIError('Failed to fetch transaction data')
    }
  }

  async getGasPrice(chainId: number = config.CHAIN_ID): Promise<string> {
    try {
      const provider = this.getProvider(chainId)
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice || parseEther('0.025') // 25 nAVAX default
      
      return formatEther(gasPrice)
    } catch (error) {
      logger.error('Failed to fetch gas price', error as Error, { chainId })
      throw new APIError('Failed to fetch gas price')
    }
  }

  // Utility methods
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address)
  }

  formatEther(value: bigint): string {
    return formatEther(value)
  }

  parseEther(value: string): bigint {
    return parseEther(value)
  }

  // Check if providers are healthy
  async healthCheck(): Promise<{ [chainId: number]: boolean }> {
    const health: { [chainId: number]: boolean } = {}
    
    for (const [chainId, provider] of this.providers) {
      try {
        await provider.getBlockNumber()
        health[chainId] = true
      } catch (error) {
        logger.error(`Health check failed for chain ${chainId}`, error as Error)
        health[chainId] = false
      }
    }
    
    return health
  }
}

// Singleton instance
export const blockchainService = new BlockchainService()