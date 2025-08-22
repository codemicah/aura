import { ethers } from "ethers";
import { logger } from "../utils/logger";
import { config } from "../utils/config";
import { AaveService, DepositRequest } from "./aaveService";

export class EventListenerService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private aaveService: AaveService;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
    this.aaveService = new AaveService();

    // Contract ABI for the events we need
    const contractABI = [
      "event AaveDepositRequested(address indexed user, uint256 amount, uint256 timestamp)",
      "event AaveWithdrawalRequested(address indexed user, uint256 amount, uint256 timestamp)",
      "event BackendAction(string action, address indexed user, uint256 amount, bytes32 requestId)",
    ];

    this.contract = new ethers.Contract(
      config.YIELD_OPTIMIZER_ADDRESS,
      contractABI,
      this.provider
    );
  }

  /**
   * Start listening to smart contract events
   */
  public async startListening(): Promise<void> {
    logger.info("Starting event listener for YieldOptimizer contract...");
    logger.info(`Contract address: ${config.YIELD_OPTIMIZER_ADDRESS}`);
    logger.info(`RPC URL: ${config.RPC_URL}`);

    try {
      // Listen for Aave deposit requests
      this.contract.on(
        "AaveDepositRequested",
        async (user: string, amount: bigint, timestamp: bigint) => {
          await this.handleAaveDepositRequest(user, amount, timestamp);
        }
      );

      // Listen for Aave withdrawal requests
      this.contract.on(
        "AaveWithdrawalRequested",
        async (user: string, amount: bigint, timestamp: bigint) => {
          await this.handleAaveWithdrawalRequest(user, amount, timestamp);
        }
      );

      // Listen for general backend actions
      this.contract.on(
        "BackendAction",
        async (
          action: string,
          user: string,
          amount: bigint,
          requestId: string
        ) => {
          await this.handleBackendAction(action, user, amount, requestId);
        }
      );

      logger.info("Event listeners started successfully!");
    } catch (error) {
      logger.error("Error starting event listeners:", error as Error);
      throw error;
    }
  }

  /**
   * Stop listening to events
   */
  public stopListening(): void {
    logger.info("Stopping event listeners...");
    this.contract.removeAllListeners();
  }

  /**
   * Handle Aave deposit request event
   */
  private async handleAaveDepositRequest(
    user: string,
    amount: bigint,
    timestamp: bigint
  ): Promise<void> {
    logger.info(
      `🏦 Aave Deposit Request - User: ${user}, Amount: ${ethers.formatEther(
        amount
      )} AVAX, Time: ${new Date(Number(timestamp) * 1000).toISOString()}`
    );

    const depositRequest: DepositRequest = {
      user,
      amount: amount.toString(),
      requestId: `aave_deposit_${user}_${timestamp}`,
      timestamp: Number(timestamp),
    };

    try {
      const success = await this.aaveService.processAaveDeposit(depositRequest);

      if (success) {
        logger.info(`✅ Successfully processed Aave deposit for ${user}`);
      } else {
        logger.error(`❌ Failed to process Aave deposit for ${user}`);
      }
    } catch (error) {
      logger.error(`Error handling Aave deposit request:`, error as Error);
    }
  }

  /**
   * Handle Aave withdrawal request event
   */
  private async handleAaveWithdrawalRequest(
    user: string,
    amount: bigint,
    timestamp: bigint
  ): Promise<void> {
    logger.info(
      `🏦 Aave Withdrawal Request - User: ${user}, Amount: ${ethers.formatEther(
        amount
      )} AVAX, Time: ${new Date(Number(timestamp) * 1000).toISOString()}`
    );

    const withdrawalRequest: DepositRequest = {
      user,
      amount: amount.toString(),
      requestId: `aave_withdrawal_${user}_${timestamp}`,
      timestamp: Number(timestamp),
    };

    try {
      const success = await this.aaveService.processAaveWithdrawal(
        withdrawalRequest
      );

      if (success) {
        logger.info(`✅ Successfully processed Aave withdrawal for ${user}`);
      } else {
        logger.error(`❌ Failed to process Aave withdrawal for ${user}`);
      }
    } catch (error) {
      logger.error(`Error handling Aave withdrawal request:`, error as Error);
    }
  }

  /**
   * Handle general backend action event
   */
  private async handleBackendAction(
    action: string,
    user: string,
    amount: bigint,
    requestId: string
  ): Promise<void> {
    logger.info(
      `🔄 Backend Action - Action: ${action}, User: ${user}, Amount: ${ethers.formatEther(
        amount
      )} AVAX, RequestID: ${requestId}`
    );

    switch (action) {
      case "AAVE_DEPOSIT":
        logger.info(`Processing AAVE_DEPOSIT action for ${user}`);
        break;

      case "AAVE_WITHDRAW":
        logger.info(`Processing AAVE_WITHDRAW action for ${user}`);
        break;

      default:
        logger.warn(`Unknown backend action: ${action}`);
    }
  }

  /**
   * Get past events (useful for catching up on missed events)
   */
  public async getPastEvents(fromBlock: number = 0): Promise<void> {
    logger.info(`Fetching past events from block ${fromBlock}...`);

    try {
      const currentBlock = await this.provider.getBlockNumber();
      logger.info(`Current block: ${currentBlock}`);

      // Fetch past Aave deposit events
      const depositFilter = this.contract.filters.AaveDepositRequested();
      const depositEvents = await this.contract.queryFilter(
        depositFilter,
        currentBlock - 2000,
        currentBlock
      );

      logger.info(`Found ${depositEvents.length} past Aave deposit events`);

      // Process past events
      for (const event of depositEvents) {
        if ("args" in event && event.args) {
          await this.handleAaveDepositRequest(
            event.args.user,
            event.args.amount,
            event.args.timestamp
          );
        }
      }

      // Fetch past Aave withdrawal events
      const withdrawalFilter = this.contract.filters.AaveWithdrawalRequested();
      const withdrawalEvents = await this.contract.queryFilter(
        withdrawalFilter,
        currentBlock - 2000,
        currentBlock
      );

      logger.info(
        `Found ${withdrawalEvents.length} past Aave withdrawal events`
      );

      for (const event of withdrawalEvents) {
        if ("args" in event && event.args) {
          await this.handleAaveWithdrawalRequest(
            event.args.user,
            event.args.amount,
            event.args.timestamp
          );
        }
      }
    } catch (error) {
      logger.error("Error fetching past events:", error as Error);
    }
  }
}
