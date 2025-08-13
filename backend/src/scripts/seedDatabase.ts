import sqlite3 from "sqlite3";
import path from "path";
import { demoScenariosService } from "../services/demoScenarios";
import { aiService } from "../services/ai";

const DATABASE_PATH = path.resolve(__dirname, "../../data/defi-manager.db");

class DatabaseSeeder {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DATABASE_PATH, (err) => {
      if (err) {
        console.error("Failed to connect to database:", err);
        process.exit(1);
      }
      console.log("Connected to database for seeding");
    });
  }

  async seed(): Promise<void> {
    try {
      console.log("Starting database seeding...");
      
      // Clear existing demo data
      await this.clearDemoData();
      
      // Seed each demo user
      const demoUsers = demoScenariosService.getAllDemoUsers();
      
      for (const user of demoUsers) {
        console.log(`\nSeeding data for ${user.name}...`);
        
        // Create user profile
        await this.createUserProfile(user);
        
        // Generate and insert transactions
        await this.seedTransactions(user);
        
        // Generate and insert portfolio snapshots
        await this.seedPortfolioSnapshots(user);
        
        // Generate and insert AI recommendations
        await this.seedAIRecommendations(user);
        
        console.log(`✓ Completed seeding for ${user.name}`);
      }
      
      // Seed market data cache
      await this.seedMarketData();
      
      console.log("\n✓ Database seeding completed successfully!");
      
    } catch (error) {
      console.error("Seeding failed:", error);
      process.exit(1);
    } finally {
      await this.close();
    }
  }

  private async clearDemoData(): Promise<void> {
    const demoAddresses = [
      "0x1234567890123456789012345678901234567890",
      "0x2345678901234567890123456789012345678901",
      "0x3456789012345678901234567890123456789012"
    ];
    
    return new Promise((resolve, reject) => {
      const placeholders = demoAddresses.map(() => '?').join(',');
      const sql = `DELETE FROM user_profiles WHERE address IN (${placeholders})`;
      
      this.db.run(sql, demoAddresses, (err) => {
        if (err) {
          console.error("Failed to clear demo data:", err);
          reject(err);
        } else {
          console.log("Cleared existing demo data");
          resolve();
        }
      });
    });
  }

  private async createUserProfile(user: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get risk assessment from demo scenarios
      const assessment = demoScenariosService.getDemoUserRiskAssessment(user.name.split(' ')[0].toLowerCase());
      if (!assessment) {
        reject(new Error(`No assessment found for ${user.name}`));
        return;
      }

      // Calculate risk score using AI service
      const riskScore = aiService.calculateRiskScore(assessment);
      const riskProfile = aiService.getRiskProfile(riskScore);

      const sql = `
        INSERT INTO user_profiles (
          id, address, risk_score, risk_profile, total_deposited,
          last_rebalance, auto_rebalance, preferences, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const preferences = {
        maxSlippage: riskProfile === "Conservative" ? 0.5 : riskProfile === "Balanced" ? 1.0 : 2.0,
        minYieldThreshold: riskProfile === "Conservative" ? 5 : riskProfile === "Balanced" ? 8 : 12,
        rebalanceFrequency: riskProfile === "Conservative" ? 30 : riskProfile === "Balanced" ? 14 : 7,
        excludedProtocols: [],
        notificationSettings: {
          email: true,
          rebalanceAlerts: true,
          yieldThresholdAlerts: true,
          portfolioUpdates: true
        }
      };

      const params = [
        this.generateId(),
        user.walletAddress,
        riskScore,
        riskProfile,
        user.initialDeposit.toString(),
        thirtyDaysAgo.toISOString(),
        true,
        JSON.stringify(preferences),
        ninetyDaysAgo.toISOString(),
        now.toISOString()
      ];

      this.db.run(sql, params, (err) => {
        if (err) {
          console.error(`Failed to create profile for ${user.name}:`, err);
          reject(err);
        } else {
          console.log(`  ✓ Created user profile (Risk Score: ${riskScore}, Profile: ${riskProfile})`);
          resolve();
        }
      });
    });
  }

  private async seedTransactions(user: any): Promise<void> {
    const transactions = demoScenariosService.generateTransactionHistory(user.walletAddress, 90);
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      
      if (transactions.length === 0) {
        resolve();
        return;
      }

      transactions.forEach((tx) => {
        const sql = `
          INSERT INTO transactions (
            id, user_id, type, amount, hash, status, 
            gas_used, gas_price, block_number, chain_id, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          tx.id,
          tx.userId,
          tx.type,
          tx.amount,
          tx.hash,
          tx.status,
          tx.gasUsed,
          tx.gasPrice,
          tx.blockNumber,
          43114, // Avalanche mainnet
          tx.timestamp.toISOString()
        ];

        this.db.run(sql, params, (err) => {
          if (err) {
            console.error(`Failed to insert transaction:`, err);
            reject(err);
          } else {
            completed++;
            if (completed === transactions.length) {
              console.log(`  ✓ Created ${transactions.length} transactions`);
              resolve();
            }
          }
        });
      });
    });
  }

  private async seedPortfolioSnapshots(user: any): Promise<void> {
    const snapshots = demoScenariosService.generatePortfolioSnapshots(user.walletAddress, 90);
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      
      if (snapshots.length === 0) {
        resolve();
        return;
      }

      // Insert only every 3rd snapshot to reduce data volume
      const reducedSnapshots = snapshots.filter((_, index) => index % 3 === 0);

      reducedSnapshots.forEach((snapshot) => {
        const sql = `
          INSERT INTO portfolio_snapshots (
            id, user_id, total_value, benqi_amount, traderjoe_amount,
            yieldyak_amount, estimated_apy, avax_price, snapshot_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          snapshot.id,
          snapshot.userId,
          snapshot.totalValue,
          snapshot.benqiAmount,
          snapshot.traderjoeAmount,
          snapshot.yieldyakAmount,
          snapshot.estimatedAPY,
          snapshot.avaxPrice,
          snapshot.snapshotDate.toISOString()
        ];

        this.db.run(sql, params, (err) => {
          if (err) {
            console.error(`Failed to insert portfolio snapshot:`, err);
            reject(err);
          } else {
            completed++;
            if (completed === reducedSnapshots.length) {
              console.log(`  ✓ Created ${reducedSnapshots.length} portfolio snapshots`);
              resolve();
            }
          }
        });
      });
    });
  }

  private async seedAIRecommendations(user: any): Promise<void> {
    const recommendations = demoScenariosService.generateAIRecommendations(user.walletAddress);
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      
      if (recommendations.length === 0) {
        resolve();
        return;
      }

      recommendations.forEach((rec) => {
        const sql = `
          INSERT INTO ai_recommendations (
            id, user_id, type, title, description, confidence,
            expected_return, risk_level, action_data, is_acted_upon, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          rec.id,
          rec.userId,
          rec.type,
          rec.title,
          rec.description,
          rec.confidence,
          rec.expectedReturn,
          rec.riskLevel,
          rec.actionData,
          rec.isActedUpon,
          rec.createdAt.toISOString()
        ];

        this.db.run(sql, params, (err) => {
          if (err) {
            console.error(`Failed to insert AI recommendation:`, err);
            reject(err);
          } else {
            completed++;
            if (completed === recommendations.length) {
              console.log(`  ✓ Created ${recommendations.length} AI recommendations`);
              resolve();
            }
          }
        });
      });
    });
  }

  private async seedMarketData(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("\nSeeding market data cache...");
      
      const marketData = [
        {
          id: this.generateId(),
          protocol: "benqi",
          apy: 7.5,
          tvl: "450000000",
          volume24h: "12000000",
          fees24h: "24000",
          utilization: 0.75,
          isActive: true
        },
        {
          id: this.generateId(),
          protocol: "traderjoe",
          apy: 11.2,
          tvl: "280000000",
          volume24h: "45000000",
          fees24h: "135000",
          utilization: 0.82,
          isActive: true
        },
        {
          id: this.generateId(),
          protocol: "yieldyak",
          apy: 15.8,
          tvl: "120000000",
          volume24h: "8000000",
          fees24h: "16000",
          utilization: 0.68,
          isActive: true
        }
      ];

      let completed = 0;
      
      marketData.forEach((data) => {
        const sql = `
          INSERT OR REPLACE INTO market_data_cache (
            id, protocol, apy, tvl, volume_24h, fees_24h, utilization, is_active, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          data.id,
          data.protocol,
          data.apy,
          data.tvl,
          data.volume24h,
          data.fees24h,
          data.utilization,
          data.isActive,
          new Date().toISOString()
        ];

        this.db.run(sql, params, (err) => {
          if (err) {
            console.error(`Failed to insert market data for ${data.protocol}:`, err);
            reject(err);
          } else {
            completed++;
            if (completed === marketData.length) {
              console.log(`✓ Created market data for ${marketData.length} protocols`);
              resolve();
            }
          }
        });
      });
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error("Error closing database:", err);
        }
        resolve();
      });
    });
  }
}

// Run the seeder
const seeder = new DatabaseSeeder();
seeder.seed().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});