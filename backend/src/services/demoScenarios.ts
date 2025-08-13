import { logger } from "../utils/logger";
import { RiskAssessmentAnswers } from "./ai";

export interface DemoUser {
  name: string;
  age: number;
  occupation: string;
  income: number;
  monthlyExpenses: number;
  familyStatus: string;
  investmentGoal: "short_term" | "medium_term" | "long_term" | "retirement";
  riskTolerance: "very_low" | "low" | "medium" | "high" | "very_high";
  investmentExperience: "none" | "beginner" | "intermediate" | "advanced" | "expert";
  timeHorizon: number;
  liquidityNeed: "high" | "medium" | "low";
  description: string;
  walletAddress: string;
  initialDeposit: number;
  monthlyContribution: number;
  emergencyFundTarget: number;
  financialGoals: string[];
  expectedRiskScore: number;
  expectedRiskProfile: "Conservative" | "Balanced" | "Aggressive";
}

export class DemoScenariosService {
  private demoUsers: Map<string, DemoUser>;

  constructor() {
    this.demoUsers = new Map();
    this.initializeDemoUsers();
    logger.info("Demo scenarios service initialized with 3 user personas");
  }

  private initializeDemoUsers(): void {
    // Sarah - Conservative User
    const sarah: DemoUser = {
      name: "Sarah Thompson",
      age: 35,
      occupation: "Marketing Manager",
      income: 85000,
      monthlyExpenses: 5000,
      familyStatus: "Married with 2 kids",
      investmentGoal: "long_term",
      riskTolerance: "low",
      investmentExperience: "beginner",
      timeHorizon: 15,
      liquidityNeed: "high",
      description: "Sarah is a 35-year-old marketing manager, married with two young children. She prioritizes financial security and building an emergency fund while saving for her children's education. Her investment approach is conservative, focusing on stable returns with minimal risk.",
      walletAddress: "0x1234567890123456789012345678901234567890",
      initialDeposit: 10000,
      monthlyContribution: 1500,
      emergencyFundTarget: 30000,
      financialGoals: [
        "Build 6-month emergency fund",
        "Save for children's college education",
        "Steady wealth preservation",
        "Minimize investment volatility"
      ],
      expectedRiskScore: 28,
      expectedRiskProfile: "Conservative"
    };

    // Mike - Balanced User
    const mike: DemoUser = {
      name: "Mike Chen",
      age: 30,
      occupation: "Software Engineer",
      income: 120000,
      monthlyExpenses: 3500,
      familyStatus: "Single",
      investmentGoal: "medium_term",
      riskTolerance: "medium",
      investmentExperience: "intermediate",
      timeHorizon: 10,
      liquidityNeed: "medium",
      description: "Mike is a 30-year-old software engineer working at a tech company. He has a stable income and moderate expenses, allowing for consistent investing. He seeks balanced growth with acceptable risk levels, aiming to build wealth for future home ownership and early retirement.",
      walletAddress: "0x2345678901234567890123456789012345678901",
      initialDeposit: 25000,
      monthlyContribution: 3000,
      emergencyFundTarget: 20000,
      financialGoals: [
        "Save for home down payment",
        "Build investment portfolio",
        "Achieve 8-10% annual returns",
        "Plan for early retirement at 50"
      ],
      expectedRiskScore: 52,
      expectedRiskProfile: "Balanced"
    };

    // Jennifer - Aggressive User
    const jennifer: DemoUser = {
      name: "Jennifer Rodriguez",
      age: 25,
      occupation: "Tech Entrepreneur",
      income: 150000,
      monthlyExpenses: 2500,
      familyStatus: "Single",
      investmentGoal: "long_term",
      riskTolerance: "high",
      investmentExperience: "advanced",
      timeHorizon: 20,
      liquidityNeed: "low",
      description: "Jennifer is a 25-year-old tech entrepreneur with high income and low expenses. She has a high risk tolerance and seeks maximum returns through aggressive DeFi strategies. Her long investment horizon allows her to weather market volatility in pursuit of superior gains.",
      walletAddress: "0x3456789012345678901234567890123456789012",
      initialDeposit: 50000,
      monthlyContribution: 5000,
      emergencyFundTarget: 15000,
      financialGoals: [
        "Maximize yield through DeFi",
        "Achieve 15%+ annual returns",
        "Build substantial wealth by 40",
        "Explore high-yield opportunities"
      ],
      expectedRiskScore: 78,
      expectedRiskProfile: "Aggressive"
    };

    this.demoUsers.set("sarah", sarah);
    this.demoUsers.set("mike", mike);
    this.demoUsers.set("jennifer", jennifer);
  }

  getDemoUser(name: string): DemoUser | undefined {
    return this.demoUsers.get(name.toLowerCase());
  }

  getAllDemoUsers(): DemoUser[] {
    return Array.from(this.demoUsers.values());
  }

  getDemoUserRiskAssessment(name: string): RiskAssessmentAnswers | null {
    const user = this.getDemoUser(name);
    if (!user) return null;

    return {
      age: user.age,
      income: user.income,
      monthlyExpenses: user.monthlyExpenses,
      investmentGoal: user.investmentGoal,
      riskTolerance: user.riskTolerance,
      investmentExperience: user.investmentExperience,
      timeHorizon: user.timeHorizon,
      liquidityNeed: user.liquidityNeed
    };
  }

  generateTransactionHistory(userId: string, days: number = 90): any[] {
    const user = Array.from(this.demoUsers.values()).find(
      u => u.walletAddress === userId || u.name.toLowerCase().includes(userId.toLowerCase())
    );
    
    if (!user) return [];

    const transactions = [];
    const now = new Date();
    
    // Initial deposit
    transactions.push({
      id: this.generateId(),
      userId: user.walletAddress,
      type: "deposit",
      amount: user.initialDeposit.toString(),
      hash: `0x${this.generateHash()}`,
      status: "confirmed",
      gasUsed: "150000",
      gasPrice: "25000000000",
      blockNumber: 35000000 + Math.floor(Math.random() * 100000),
      timestamp: new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    });

    // Monthly contributions
    for (let i = 1; i <= Math.floor(days / 30); i++) {
      transactions.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "deposit",
        amount: user.monthlyContribution.toString(),
        hash: `0x${this.generateHash()}`,
        status: "confirmed",
        gasUsed: "150000",
        gasPrice: "25000000000",
        blockNumber: 35000000 + Math.floor(Math.random() * 100000) + i * 10000,
        timestamp: new Date(now.getTime() - (days - i * 30) * 24 * 60 * 60 * 1000)
      });
    }

    // Rebalance transactions
    for (let i = 0; i < Math.floor(days / 30); i++) {
      transactions.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "rebalance",
        amount: "0",
        hash: `0x${this.generateHash()}`,
        status: "confirmed",
        gasUsed: "250000",
        gasPrice: "25000000000",
        blockNumber: 35000000 + Math.floor(Math.random() * 100000) + i * 15000,
        timestamp: new Date(now.getTime() - (days - 15 - i * 30) * 24 * 60 * 60 * 1000)
      });
    }

    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  generatePortfolioSnapshots(userId: string, days: number = 90): any[] {
    const user = Array.from(this.demoUsers.values()).find(
      u => u.walletAddress === userId || u.name.toLowerCase().includes(userId.toLowerCase())
    );
    
    if (!user) return [];

    const snapshots = [];
    const now = new Date();
    let totalValue = user.initialDeposit;
    
    // Generate daily snapshots
    for (let i = days; i >= 0; i--) {
      // Add monthly contribution
      if (i % 30 === 0 && i !== days) {
        totalValue += user.monthlyContribution;
      }

      // Simulate growth based on risk profile
      const dailyGrowthRate = user.expectedRiskProfile === "Conservative" ? 0.0002 :
                             user.expectedRiskProfile === "Balanced" ? 0.0003 : 0.0004;
      
      // Add some volatility
      const volatility = (Math.random() - 0.5) * 0.002;
      totalValue *= (1 + dailyGrowthRate + volatility);

      // Calculate allocation based on risk profile
      let benqiPercentage, traderJoePercentage, yieldYakPercentage;
      
      if (user.expectedRiskProfile === "Conservative") {
        benqiPercentage = 70;
        traderJoePercentage = 30;
        yieldYakPercentage = 0;
      } else if (user.expectedRiskProfile === "Balanced") {
        benqiPercentage = 40;
        traderJoePercentage = 40;
        yieldYakPercentage = 20;
      } else {
        benqiPercentage = 20;
        traderJoePercentage = 30;
        yieldYakPercentage = 50;
      }

      snapshots.push({
        id: this.generateId(),
        userId: user.walletAddress,
        totalValue: totalValue.toFixed(2),
        benqiAmount: (totalValue * benqiPercentage / 100).toFixed(2),
        traderjoeAmount: (totalValue * traderJoePercentage / 100).toFixed(2),
        yieldyakAmount: (totalValue * yieldYakPercentage / 100).toFixed(2),
        estimatedAPY: user.expectedRiskProfile === "Conservative" ? 7.5 :
                     user.expectedRiskProfile === "Balanced" ? 11.2 : 15.8,
        avaxPrice: 35 + Math.random() * 10,
        snapshotDate: new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      });
    }

    return snapshots;
  }

  generateAIRecommendations(userId: string): any[] {
    const user = Array.from(this.demoUsers.values()).find(
      u => u.walletAddress === userId || u.name.toLowerCase().includes(userId.toLowerCase())
    );
    
    if (!user) return [];

    const recommendations = [];
    const now = new Date();

    // Generate recommendations based on user profile
    if (user.expectedRiskProfile === "Conservative") {
      recommendations.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "rebalance",
        title: "Optimize for Stability",
        description: "Shift 5% from TraderJoe LP to Benqi lending for increased stability during market volatility.",
        confidence: 0.75,
        expectedReturn: 7.2,
        riskLevel: "low",
        actionData: JSON.stringify({
          fromProtocol: "traderjoe",
          toProtocol: "benqi",
          percentage: 5
        }),
        isActedUpon: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      });

      recommendations.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "deposit",
        title: "Emergency Fund Target Reached",
        description: "Your emergency fund is 80% complete. Consider increasing monthly contributions by $200.",
        confidence: 0.85,
        expectedReturn: null,
        riskLevel: "low",
        actionData: JSON.stringify({
          currentEmergencyFund: 24000,
          target: 30000,
          suggestedIncrease: 200
        }),
        isActedUpon: false,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      });
    } else if (user.expectedRiskProfile === "Balanced") {
      recommendations.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "yield_opportunity",
        title: "Higher Yield Available",
        description: "YieldYak is offering 2% higher APY than current allocation. Consider rebalancing.",
        confidence: 0.72,
        expectedReturn: 13.2,
        riskLevel: "medium",
        actionData: JSON.stringify({
          currentAPY: 11.2,
          newAPY: 13.2,
          protocol: "yieldyak"
        }),
        isActedUpon: true,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      });

      recommendations.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "rebalance",
        title: "Quarterly Rebalancing Due",
        description: "Your portfolio has drifted from target allocation. Rebalance to maintain risk profile.",
        confidence: 0.80,
        expectedReturn: 11.5,
        riskLevel: "medium",
        actionData: JSON.stringify({
          currentAllocation: { benqi: 38, traderjoe: 44, yieldyak: 18 },
          targetAllocation: { benqi: 40, traderjoe: 40, yieldyak: 20 }
        }),
        isActedUpon: false,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      });
    } else {
      recommendations.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "yield_opportunity",
        title: "YieldYak Boost Strategy Available",
        description: "New YieldYak vault with 18% APY launched. Perfect fit for your aggressive strategy.",
        confidence: 0.68,
        expectedReturn: 18.0,
        riskLevel: "high",
        actionData: JSON.stringify({
          vaultName: "AVAX-USDC Boost",
          currentAPY: 15.8,
          newAPY: 18.0,
          riskScore: 85
        }),
        isActedUpon: false,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      });

      recommendations.push({
        id: this.generateId(),
        userId: user.walletAddress,
        type: "rebalance",
        title: "Maximize Yield Farming Returns",
        description: "Market conditions favor yield farming. Increase YieldYak allocation by 10%.",
        confidence: 0.70,
        expectedReturn: 16.5,
        riskLevel: "high",
        actionData: JSON.stringify({
          reason: "Bull market conditions",
          suggestedAllocation: { benqi: 15, traderjoe: 25, yieldyak: 60 }
        }),
        isActedUpon: true,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      });
    }

    return recommendations;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private generateHash(): string {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

export const demoScenariosService = new DemoScenariosService();