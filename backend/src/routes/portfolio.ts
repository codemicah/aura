import { Router } from "express";
import { portfolioController } from "../controllers/portfolioController";
import { validateEthereumAddress } from "../middleware";

const router = Router();

/**
 * @route   GET /api/v1/portfolio/:address
 * @desc    Get user portfolio data from blockchain
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  "/:address",
  validateEthereumAddress("address"),
  portfolioController.getUserPortfolio
);

/**
 * @route   GET /api/v1/portfolio/:address/balance
 * @desc    Get user AVAX balance
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  "/:address/balance",
  validateEthereumAddress("address"),
  portfolioController.getUserBalance
);

/**
 * @route   GET /api/v1/portfolio/:address/rebalance-recommendation
 * @desc    Get rebalance recommendation for user portfolio
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get(
  "/:address/rebalance-recommendation",
  validateEthereumAddress("address"),
  portfolioController.getRebalanceRecommendation
);

/**
 * @route   GET /api/v1/portfolio/:address/transactions
 * @desc    Get user transaction history
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   limit - Number of transactions to return (optional, defaults to 50)
 */
router.get(
  "/:address/transactions",
  validateEthereumAddress("address"),
  portfolioController.getUserTransactions
);

/**
 * @route   POST /api/v1/portfolio/:address/transactions
 * @desc    Save a new transaction
 * @access  Public
 * @param   address - Ethereum wallet address
 * @body    type, amount, hash, status
 */
router.post(
  "/:address/transactions",
  validateEthereumAddress("address"),
  portfolioController.saveTransaction
);

/**
 * @route   GET /api/v1/portfolio/:address/history
 * @desc    Get portfolio history snapshots
 * @access  Public
 * @param   address - Ethereum wallet address
 * @query   days - Number of days to fetch (optional, defaults to 30)
 */
router.get(
  "/:address/history",
  validateEthereumAddress("address"),
  portfolioController.getPortfolioHistory
);

/**
 * @route   GET /api/v1/portfolio/:address/profile
 * @desc    Get user risk profile
 * @access  Public
 * @param   address - Ethereum wallet address
 */
router.get(
  "/:address/profile",
  validateEthereumAddress("address"),
  portfolioController.getUserProfile
);

/**
 * @route   POST /api/v1/portfolio/:address/profile
 * @desc    Save or update user risk profile
 * @access  Public
 * @param   address - Ethereum wallet address
 * @body    riskScore, riskProfile, preferences
 */
router.post(
  "/:address/profile",
  validateEthereumAddress("address"),
  portfolioController.saveUserProfile
);

/**
 * @route   GET /api/v1/portfolio/transaction/:hash
 * @desc    Get transaction status and details
 * @access  Public
 * @param   hash - Transaction hash
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get("/transaction/:hash", portfolioController.getTransactionStatus);

/**
 * @route   GET /api/v1/portfolio/gas-price
 * @desc    Get current gas price for transactions
 * @access  Public
 * @query   chainId - Blockchain chain ID (optional, defaults to 43114)
 */
router.get("/gas-price", portfolioController.getGasPrice);

/**
 * @route   GET /api/v1/portfolio/health
 * @desc    Health check for blockchain and DeFi services
 * @access  Public
 */
router.get("/health", portfolioController.healthCheck);

export default router;
