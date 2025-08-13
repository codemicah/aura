import {
  ethers,
  JsonRpcProvider,
  Contract,
  formatEther,
  parseEther,
} from "ethers";
import { config, getChainConfig, getCurrentChainConfig } from "../utils/config";
import { logger } from "../utils/logger";
import { APIError } from "../types";

// Import ABI from frontend (we'll copy it)
import yieldOptimizerABI from "./abis/YieldOptimizer.json";

// Simple in-memory transaction store for demo purposes
interface TransactionRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'rebalance';
  amount: string;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  timestamp: Date;
  address: string;
}

export class BlockchainService {
  private providers: Map<number, JsonRpcProvider> = new Map();
  private contracts: Map<string, Contract> = new Map();
  private transactionHistory: Map<string, TransactionRecord[]> = new Map();

  constructor() {
    this.initializeProviders();
    this.initializeContracts();
    // Do not initialize demo transactions - only real transactions will be shown
  }

  private initializeProviders(): void {
    try {
      // Initialize provider for the configured network only
      const provider = new JsonRpcProvider(config.RPC_URL);
      this.providers.set(config.CHAIN_ID, provider);

      logger.info("Blockchain provider initialized", {
        chainId: config.CHAIN_ID,
        rpcUrl: config.RPC_URL
      });
    } catch (error) {
      logger.error("Failed to initialize blockchain provider", error as Error);
      throw new APIError("Failed to initialize blockchain connection");
    }
  }

  private initializeContracts(): void {
    try {
      // Use the single contract address for the current chain
      const contractAddress = config.YIELD_OPTIMIZER_ADDRESS;
      
      if (contractAddress) {
        // Initialize contract on the configured chain
        const provider = this.getProvider(config.CHAIN_ID);
        const contract = new Contract(
          contractAddress,
          yieldOptimizerABI.abi,
          provider
        );
        this.contracts.set(`chain-${config.CHAIN_ID}`, contract);
        
        logger.info("Smart contract initialized", {
          address: contractAddress.slice(0, 10) + "...",
          chainId: config.CHAIN_ID
        });
      } else {
        logger.warn("No YieldOptimizer contract address configured");
      }
    } catch (error) {
      logger.error("Failed to initialize smart contract", error as Error);
    }
  }

  getProvider(chainId: number = config.CHAIN_ID): JsonRpcProvider {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new APIError(`No provider configured for chain ${chainId}`);
    }
    return provider;
  }

  getContract(chainId: number = config.CHAIN_ID): Contract {
    const key = `chain-${chainId}`;
    const contract = this.contracts.get(key);
    if (!contract) {
      throw new APIError(
        `No contract deployed for chain ${chainId}. Please deploy the YieldOptimizer contract and set YIELD_OPTIMIZER_ADDRESS in .env`
      );
    }
    return contract;
  }

  hasContract(chainId: number = config.CHAIN_ID): boolean {
    const key = `chain-${chainId}`;
    return this.contracts.has(key);
  }

  async getBlockNumber(chainId: number = config.CHAIN_ID): Promise<number> {
    try {
      const provider = this.getProvider(chainId);
      const blockNumber = await provider.getBlockNumber();
      logger.blockchain("Block number fetched", chainId, { blockNumber });
      return blockNumber;
    } catch (error) {
      logger.error("Failed to fetch block number", error as Error, { chainId });
      throw new APIError("Failed to fetch blockchain data");
    }
  }

  async getBalance(
    address: string,
    chainId: number = config.CHAIN_ID
  ): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const balance = await provider.getBalance(address);
      const balanceEth = formatEther(balance);

      logger.blockchain("Balance fetched", chainId, {
        address: address.slice(0, 8) + "...",
        balance: balanceEth,
      });

      return balanceEth;
    } catch (error) {
      logger.error("Failed to fetch balance", error as Error, {
        address,
        chainId,
      });
      throw new APIError("Failed to fetch wallet balance");
    }
  }

  async getUserPortfolio(
    address: string,
    chainId: number = config.CHAIN_ID
  ): Promise<any> {
    try {
      const contract = this.getContract(chainId);
      const portfolio = await contract.getUserPortfolio(address);

      logger.blockchain("Portfolio fetched", chainId, {
        address: address.slice(0, 8) + "...",
      });

      return {
        profile: {
          riskScore: Number(portfolio[0].riskScore),
          totalDeposited: formatEther(portfolio[0].totalDeposited),
          lastRebalance: new Date(Number(portfolio[0].lastRebalance) * 1000),
          autoRebalance: portfolio[0].autoRebalance,
        },
        allocation: {
          benqiAmount: formatEther(portfolio[1].benqiAmount),
          traderJoeAmount: formatEther(portfolio[1].traderJoeAmount),
          yieldYakAmount: formatEther(portfolio[1].yieldYakAmount),
        },
        estimatedValue: formatEther(portfolio[2]),
      };
    } catch (error) {
      logger.error("Failed to fetch user portfolio", error as Error, {
        address,
        chainId,
      });
      throw new APIError("Failed to fetch portfolio data");
    }
  }

  async getCurrentYields(chainId: number = config.CHAIN_ID): Promise<any> {
    try {
      const contract = this.getContract(chainId);
      const yields = await contract.getCurrentYields();

      logger.blockchain("Yields fetched", chainId);

      return {
        benqi: Number(yields[0]) / 100, // Convert from basis points
        traderJoe: Number(yields[1]) / 100,
        yieldYak: Number(yields[2]) / 100,
        lastUpdated: new Date(Number(yields[3]) * 1000),
      };
    } catch (error) {
      logger.error("Failed to fetch current yields", error as Error, {
        chainId,
      });
      throw new APIError("Failed to fetch yield data");
    }
  }

  async getRebalanceRecommendation(
    address: string,
    chainId: number = config.CHAIN_ID
  ): Promise<any> {
    try {
      const contract = this.getContract(chainId);
      const recommendation = await contract.getRebalanceRecommendation(address);

      logger.blockchain("Rebalance recommendation fetched", chainId, {
        address: address.slice(0, 8) + "...",
      });

      return {
        shouldRebalance: recommendation[0],
        newAllocation: {
          benqi: formatEther(recommendation[1]),
          traderJoe: formatEther(recommendation[2]),
          yieldYak: formatEther(recommendation[3]),
        },
      };
    } catch (error) {
      logger.error("Failed to fetch rebalance recommendation", error as Error, {
        address,
        chainId,
      });
      throw new APIError("Failed to fetch rebalance recommendation");
    }
  }

  async getTransactionReceipt(
    hash: string,
    chainId: number = config.CHAIN_ID
  ): Promise<any> {
    try {
      const provider = this.getProvider(chainId);
      const receipt = await provider.getTransactionReceipt(hash);

      if (receipt) {
        logger.transaction(
          hash,
          receipt.status === 1 ? "confirmed" : "failed",
          {
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
          }
        );
      }

      return receipt;
    } catch (error) {
      logger.error("Failed to fetch transaction receipt", error as Error, {
        hash,
        chainId,
      });
      throw new APIError("Failed to fetch transaction data");
    }
  }

  async getGasPrice(chainId: number = config.CHAIN_ID): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || parseEther("0.025"); // 25 nAVAX default

      return formatEther(gasPrice);
    } catch (error) {
      logger.error("Failed to fetch gas price", error as Error, { chainId });
      throw new APIError("Failed to fetch gas price");
    }
  }

  // Utility methods
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  formatEther(value: bigint): string {
    return formatEther(value);
  }

  parseEther(value: string): bigint {
    return parseEther(value);
  }

  // Check if providers are healthy
  async healthCheck(): Promise<{ [chainId: number]: boolean }> {
    const health: { [chainId: number]: boolean } = {};

    for (const [chainId, provider] of this.providers) {
      try {
        await provider.getBlockNumber();
        health[chainId] = true;
      } catch (error) {
        logger.error(
          `Health check failed for chain ${chainId}`,
          error as Error
        );
        health[chainId] = false;
      }
    }

    return health;
  }

  // Initialize demo transactions for testing
  private initializeDemoTransactions(): void {
    // Add some demo transactions for common test addresses
    const demoAddresses = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat account 0
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat account 1
    ];

    demoAddresses.forEach(address => {
      const transactions: TransactionRecord[] = [
        {
          id: `${address}-1`,
          type: 'deposit',
          amount: '10.0',
          hash: '0x' + '1'.repeat(64),
          status: 'confirmed',
          gasUsed: '150000',
          gasPrice: '25',
          blockNumber: 100,
          timestamp: new Date(Date.now() - 86400000 * 7), // 7 days ago
          address,
        },
        {
          id: `${address}-2`,
          type: 'rebalance',
          amount: '0',
          hash: '0x' + '2'.repeat(64),
          status: 'confirmed',
          gasUsed: '200000',
          gasPrice: '25',
          blockNumber: 150,
          timestamp: new Date(Date.now() - 86400000 * 3), // 3 days ago
          address,
        },
        {
          id: `${address}-3`,
          type: 'deposit',
          amount: '5.0',
          hash: '0x' + '3'.repeat(64),
          status: 'confirmed',
          gasUsed: '150000',
          gasPrice: '30',
          blockNumber: 200,
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          address,
        },
      ];
      this.transactionHistory.set(address.toLowerCase(), transactions);
    });
  }

  // Add a transaction to history (or update if it exists)
  addTransaction(transaction: Omit<TransactionRecord, 'id' | 'timestamp'>): void {
    const address = transaction.address.toLowerCase();
    const existingTxs = this.transactionHistory.get(address) || [];
    
    // Check if transaction with same hash already exists
    const existingIndex = existingTxs.findIndex(tx => tx.hash === transaction.hash);
    
    if (existingIndex !== -1) {
      // Update existing transaction
      existingTxs[existingIndex] = {
        ...existingTxs[existingIndex],
        ...transaction,
        timestamp: existingTxs[existingIndex].timestamp, // Keep original timestamp
      };
      
      logger.info('Transaction updated in history', {
        address: address.slice(0, 8) + '...',
        type: transaction.type,
        hash: transaction.hash,
        status: transaction.status,
      });
    } else {
      // Add new transaction
      const newTransaction: TransactionRecord = {
        ...transaction,
        id: `${address}-${Date.now()}`,
        timestamp: new Date(),
      };

      existingTxs.unshift(newTransaction); // Add to beginning
      
      logger.info('Transaction added to history', {
        address: address.slice(0, 8) + '...',
        type: transaction.type,
        hash: transaction.hash,
      });
    }
    
    this.transactionHistory.set(address, existingTxs);
  }

  // Get user transaction history
  getUserTransactionHistory(address: string, limit: number = 50): TransactionRecord[] {
    const transactions = this.transactionHistory.get(address.toLowerCase()) || [];
    return transactions.slice(0, limit);
  }

  // Update transaction status
  updateTransactionStatus(address: string, hash: string, status: 'confirmed' | 'failed', blockNumber?: number): void {
    const transactions = this.transactionHistory.get(address.toLowerCase());
    if (transactions) {
      const tx = transactions.find(t => t.hash === hash);
      if (tx) {
        tx.status = status;
        if (blockNumber) tx.blockNumber = blockNumber;
        logger.info('Transaction status updated', {
          address: address.slice(0, 8) + '...',
          hash: hash.slice(0, 10) + '...',
          status,
        });
      }
    }
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();
