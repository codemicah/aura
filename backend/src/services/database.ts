import sqlite3 from "sqlite3";
import path from "path";
import { config } from "../utils/config";
import { logger } from "../utils/logger";
import { APIError, UserProfile, Transaction, AIRecommendation } from "../types";

export class DatabaseService {
  private db: sqlite3.Database | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // Ensure data directory exists
      const dbPath = path.resolve(config.DATABASE_PATH);
      const dbDir = path.dirname(dbPath);

      const fs = require("fs");
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Open database connection
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error("Failed to connect to database", err);
          throw new APIError("Database connection failed");
        }
        logger.info("Connected to SQLite database", { path: dbPath });
        this.createTables();
      });

      // Enable foreign keys
      this.db.run("PRAGMA foreign_keys = ON");
    } catch (error) {
      logger.error("Failed to initialize database", error as Error);
      throw new APIError("Failed to initialize database");
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Create tables first, then indexes
    this.createTablesSequentially();
  }

  private createTablesSequentially(): void {
    if (!this.db) return;

    const tables = [
      // User profiles table
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        address TEXT UNIQUE NOT NULL,
        risk_score INTEGER NOT NULL CHECK(risk_score >= 0 AND risk_score <= 100),
        risk_profile TEXT NOT NULL CHECK(risk_profile IN ('Conservative', 'Balanced', 'Aggressive')),
        total_deposited TEXT DEFAULT '0',
        last_rebalance DATETIME DEFAULT CURRENT_TIMESTAMP,
        auto_rebalance BOOLEAN DEFAULT TRUE,
        preferences TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('deposit', 'withdraw', 'rebalance')),
        amount TEXT NOT NULL,
        hash TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'failed')),
        gas_used TEXT,
        gas_price TEXT,
        block_number INTEGER,
        chain_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE CASCADE
      )`,

      // AI recommendations table
      `CREATE TABLE IF NOT EXISTS ai_recommendations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('rebalance', 'deposit', 'withdraw', 'yield_opportunity')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
        expected_return REAL,
        risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high')),
        action_data TEXT DEFAULT '{}',
        is_acted_upon BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE CASCADE
      )`,

      // Portfolio snapshots table (for historical tracking)
      `CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        total_value TEXT NOT NULL,
        aave_amount TEXT DEFAULT '0',
        benqi_amount TEXT DEFAULT '0',
        traderjoe_amount TEXT DEFAULT '0',
        yieldyak_amount TEXT DEFAULT '0',
        estimated_apy REAL DEFAULT 0,
        avax_price REAL NOT NULL,
        snapshot_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE CASCADE
      )`,

      // Market data cache table
      `CREATE TABLE IF NOT EXISTS market_data_cache (
        id TEXT PRIMARY KEY,
        protocol TEXT NOT NULL,
        apy REAL NOT NULL,
        tvl TEXT NOT NULL,
        volume_24h TEXT DEFAULT '0',
        fees_24h TEXT DEFAULT '0',
        utilization REAL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    // Create indexes for better performance
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_user_profiles_address ON user_profiles (address)",
      "CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id)",
      "CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions (hash)",
      "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status)",
      "CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations (user_id)",
      "CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_id ON portfolio_snapshots (user_id)",
      "CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots (snapshot_date)",
      "CREATE INDEX IF NOT EXISTS idx_market_data_protocol ON market_data_cache (protocol)",
    ];

    // Execute table creation sequentially
    let completed = 0;
    tables.forEach((sql, index) => {
      this.db!.run(sql, (err) => {
        if (err) {
          logger.error("Failed to create table", err);
        } else {
          completed++;
          if (completed === tables.length) {
            // All tables created, now create indexes
            this.createIndexes(indexes);
          }
        }
      });
    });
  }

  private createIndexes(indexes: string[]): void {
    if (!this.db) return;

    // Execute index creation after tables are ready
    indexes.forEach((sql) => {
      this.db!.run(sql, (err) => {
        if (err) {
          logger.error("Failed to create index", err);
        }
      });
    });

    logger.info("Database tables and indexes created successfully");
  }

  // User Profile Methods
  async createUserProfile(
    data: Omit<UserProfile, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      const id = this.generateId();
      const sql = `
        INSERT INTO user_profiles (
          id, address, risk_score, risk_profile, total_deposited, 
          last_rebalance, auto_rebalance, preferences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.address,
        data.riskScore,
        data.riskProfile,
        data.totalDeposited,
        data.lastRebalance.toISOString(),
        data.autoRebalance,
        JSON.stringify(data.preferences),
      ];

      this.db.run(sql, params, function (err) {
        if (err) {
          logger.error("Failed to create user profile", err);
          reject(new APIError("Failed to create user profile"));
        } else {
          logger.info("User profile created", { id, address: data.address });
          resolve(id);
        }
      });
    });
  }

  async getUserProfile(address: string): Promise<UserProfile | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      const sql = "SELECT * FROM user_profiles WHERE address = ?";

      this.db.get(sql, [address], (err, row: any) => {
        if (err) {
          logger.error("Failed to get user profile", err);
          reject(new APIError("Failed to get user profile"));
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            address: row.address,
            riskScore: row.risk_score,
            riskProfile: row.risk_profile,
            totalDeposited: row.total_deposited,
            lastRebalance: new Date(row.last_rebalance),
            autoRebalance: row.auto_rebalance,
            preferences: JSON.parse(row.preferences),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          });
        }
      });
    });
  }

  async updateUserProfile(
    address: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      const setClause = [];
      const params = [];

      if (updates.riskScore !== undefined) {
        setClause.push("risk_score = ?");
        params.push(updates.riskScore);
      }
      if (updates.riskProfile) {
        setClause.push("risk_profile = ?");
        params.push(updates.riskProfile);
      }
      if (updates.totalDeposited) {
        setClause.push("total_deposited = ?");
        params.push(updates.totalDeposited);
      }
      if (updates.autoRebalance !== undefined) {
        setClause.push("auto_rebalance = ?");
        params.push(updates.autoRebalance);
      }
      if (updates.preferences) {
        setClause.push("preferences = ?");
        params.push(JSON.stringify(updates.preferences));
      }

      setClause.push("updated_at = CURRENT_TIMESTAMP");
      params.push(address);

      const sql = `UPDATE user_profiles SET ${setClause.join(
        ", "
      )} WHERE address = ?`;

      this.db.run(sql, params, function (err) {
        if (err) {
          logger.error("Failed to update user profile", err);
          reject(new APIError("Failed to update user profile"));
        } else {
          resolve();
        }
      });
    });
  }

  // Transaction Methods
  async createTransaction(data: Omit<Transaction, "timestamp">): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      const sql = `
        INSERT INTO transactions (
          id, user_id, type, amount, hash, status, gas_used, 
          gas_price, block_number, chain_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.id,
        data.userId,
        data.type,
        data.amount,
        data.hash,
        data.status,
        data.gasUsed || null,
        data.gasPrice || null,
        data.blockNumber || null,
        43114, // Default to Avalanche mainnet
      ];

      this.db.run(sql, params, function (err) {
        if (err) {
          logger.error("Failed to create transaction", err);
          reject(new APIError("Failed to create transaction"));
        } else {
          resolve();
        }
      });
    });
  }

  async updateTransactionStatus(
    hash: string,
    status: Transaction["status"],
    blockNumber?: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      const sql =
        "UPDATE transactions SET status = ?, block_number = ? WHERE hash = ?";

      this.db.run(sql, [status, blockNumber || null, hash], function (err) {
        if (err) {
          logger.error("Failed to update transaction status", err);
          reject(new APIError("Failed to update transaction status"));
        } else {
          resolve();
        }
      });
    });
  }

  async getUserTransactions(
    userId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      const sql = `
        SELECT * FROM transactions 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      this.db.all(sql, [userId, limit], (err, rows: any[]) => {
        if (err) {
          logger.error("Failed to get user transactions", err);
          reject(new APIError("Failed to get user transactions"));
        } else {
          const transactions = rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            type: row.type,
            amount: row.amount,
            hash: row.hash,
            status: row.status,
            gasUsed: row.gas_used,
            gasPrice: row.gas_price,
            blockNumber: row.block_number,
            timestamp: new Date(row.timestamp),
          }));
          resolve(transactions);
        }
      });
    });
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error("Error closing database", err);
          } else {
            logger.info("Database connection closed");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Portfolio Snapshot Methods
  async createPortfolioSnapshot(data: {
    userId: string;
    totalValue: string;
    aaveAmount: string;
    benqiAmount: string;
    traderJoeAmount: string;
    yieldYakAmount: string;
    estimatedAPY: number;
    avaxPrice: number;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      const id = this.generateId();
      const sql = `
        INSERT INTO portfolio_snapshots (
          id, user_id, total_value, aave_amount, benqi_amount, traderjoe_amount, 
          yieldyak_amount, estimated_apy, avax_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.userId,
        data.totalValue,
        data.aaveAmount,
        data.benqiAmount,
        data.traderJoeAmount,
        data.yieldYakAmount,
        data.estimatedAPY,
        data.avaxPrice,
      ];

      this.db.run(sql, params, function (err) {
        if (err) {
          logger.error("Failed to create portfolio snapshot", err);
          reject(new APIError("Failed to create portfolio snapshot"));
        } else {
          resolve(id);
        }
      });
    });
  }

  async getPortfolioSnapshots(
    userAddress: string,
    days: number = 30
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      // First try to get user profile by address
      const profileSql = "SELECT id FROM user_profiles WHERE address = ?";

      this.db.get(profileSql, [userAddress], (err, profile: any) => {
        if (err) {
          logger.error("Failed to get user profile", err);
          reject(new APIError("Failed to get user profile"));
          return;
        }

        // If no profile exists, return empty array
        if (!profile) {
          resolve([]);
          return;
        }

        // Get snapshots for the user
        const sql = `
          SELECT * FROM portfolio_snapshots 
          WHERE user_id = ? 
          AND snapshot_date >= datetime('now', '-${days} days')
          ORDER BY snapshot_date DESC
        `;

        this.db!.all(sql, [profile.id], (err, rows) => {
          if (err) {
            logger.error("Failed to get portfolio snapshots", err);
            reject(new APIError("Failed to get portfolio snapshots"));
          } else {
            const snapshots = (rows || []).map((row: any) => ({
              id: row.id,
              userId: row.user_id,
              totalValue: row.total_value,
              aaveAmount: row.aave_amount || "0", // Primary field for Aave
              // benqiAmount: row.benqi_amount, // Legacy field - exclude from frontend
              traderJoeAmount: row.traderjoe_amount,
              yieldYakAmount: row.yieldyak_amount,
              estimatedAPY: row.estimated_apy,
              avaxPrice: row.avax_price,
              snapshotDate: row.snapshot_date,
            }));
            resolve(snapshots);
          }
        });
      });
    });
  }

  async getLatestSnapshot(userAddress: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new APIError("Database not connected"));

      // First get user profile by address
      const profileSql = "SELECT id FROM user_profiles WHERE address = ?";

      this.db.get(profileSql, [userAddress], (err, profile: any) => {
        if (err) {
          logger.error("Failed to get user profile", err);
          reject(new APIError("Failed to get user profile"));
          return;
        }

        if (!profile) {
          resolve(null);
          return;
        }

        const sql = `
          SELECT * FROM portfolio_snapshots 
          WHERE user_id = ? 
          ORDER BY snapshot_date DESC 
          LIMIT 1
        `;

        this.db!.get(sql, [profile.id], (err, row: any) => {
          if (err) {
            logger.error("Failed to get latest snapshot", err);
            reject(new APIError("Failed to get latest snapshot"));
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              id: row.id,
              userId: row.user_id,
              totalValue: row.total_value,
              aaveAmount: row.aave_amount || "0", // Primary field for Aave
              // benqiAmount: row.benqi_amount, // Legacy field - exclude from frontend
              traderJoeAmount: row.traderjoe_amount,
              yieldYakAmount: row.yieldyak_amount,
              estimatedAPY: row.estimated_apy,
              avaxPrice: row.avax_price,
              snapshotDate: row.snapshot_date,
            });
          }
        });
      });
    });
  }

  async healthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(false);
        return;
      }

      this.db.get("SELECT 1", (err) => {
        resolve(!err);
      });
    });
  }
}

// Singleton instance
export const databaseService = new DatabaseService();

// Graceful shutdown
process.on("SIGINT", async () => {
  await databaseService.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await databaseService.close();
  process.exit(0);
});
