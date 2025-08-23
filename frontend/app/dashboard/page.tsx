"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { PortfolioOverview } from "../../src/components/PortfolioOverview";
import { InvestmentForm } from "../../src/components/InvestmentForm";
import { InvestmentFlow } from "../../src/components/InvestmentFlow";
import PerformanceChartAdvanced from "../../src/components/PerformanceChartAdvanced";
import {
  SkeletonPortfolioOverview,
  SkeletonInvestmentForm,
} from "../../src/components/SkeletonLoaders";
import { useYieldOptimizer } from "../../src/hooks/useYieldOptimizer";
import {
  usePortfolio,
  useTransactionHistory,
} from "../../src/hooks/usePortfolio";
import { useMarketDashboard } from "../../src/hooks/useMarketData";
import { useAIRecommendations } from "../../src/hooks/useAI";
import { useRiskProfile } from "../../src/hooks/useRiskProfile";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  DollarSign,
  Percent,
  Activity,
  Shield,
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

function DashboardContent() {
  const {
    yields,
    isLoadingYields,
    portfolio: yieldOptimizerPortfolio,
    portfolioMetrics,
  } = useYieldOptimizer();
  const { portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { transactions } = useTransactionHistory();
  const { marketSummary, avaxPrice } = useMarketDashboard();
  const { recommendation, isLoading: aiLoading } = useAIRecommendations();
  const {
    hasProfile,
    isLoading: profileLoading,
    riskScore,
    riskProfile,
  } = useRiskProfile();
  const { isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "invest" | "history">(
    "overview"
  );

  useEffect(() => {
    // Set loading to false after initial render
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    change?: string;
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span
            className={`text-sm font-medium ${
              change.startsWith("+") ? "text-green-400" : "text-red-400"
            }`}
          >
            {change}
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );

  const RecommendationBanner = () => {
    if (aiLoading || !recommendation) return null;

    return (
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">AI Recommendation</h3>
            <p className="text-gray-300 text-sm">
              {recommendation.description}
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-gray-400">
                Confidence: {(recommendation.confidence * 100).toFixed(0)}%
              </span>
              <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                View Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonPortfolioOverview />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Portfolio Dashboard
          </h1>
          <p className="text-gray-400">
            Monitor and manage your DeFi investments
          </p>
        </div>

        {/* AI Recommendation Banner */}
        <RecommendationBanner />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Portfolio Value"
            value={`$${(
              parseFloat(yieldOptimizerPortfolio?.totalValue || "0") *
              (avaxPrice || 0)
            ).toFixed(2)}`}
            change={
              portfolioMetrics?.returnPercentage
                ? `${
                    portfolioMetrics.returnPercentage >= 0 ? "+" : ""
                  }${portfolioMetrics.returnPercentage.toFixed(2)}%`
                : undefined
            }
            icon={DollarSign}
            color="bg-gradient-to-br from-blue-600 to-blue-700"
          />
          <StatCard
            title="Average Yield (APY)"
            value={
              yields
                ? `${(
                    (yields.aave + yields.traderJoe + yields.yieldYak) /
                    3
                  ).toFixed(1)}%`
                : "0%"
            }
            change={undefined}
            icon={Percent}
            color="bg-gradient-to-br from-green-600 to-green-700"
          />
          <StatCard
            title="Risk Profile"
            value={riskProfile || "--"}
            icon={Shield}
            color="bg-gradient-to-br from-purple-600 to-purple-700"
          />
          <StatCard
            title="Active Positions"
            value={(() => {
              let count = 0;
              if (yieldOptimizerPortfolio?.allocation) {
                if (
                  parseFloat(yieldOptimizerPortfolio.allocation.aaveAmount) > 0
                )
                  count++;
                if (
                  parseFloat(
                    yieldOptimizerPortfolio.allocation.traderJoeAmount
                  ) > 0
                )
                  count++;
                if (
                  parseFloat(
                    yieldOptimizerPortfolio.allocation.yieldYakAmount
                  ) > 0
                )
                  count++;
              }
              return count.toString();
            })()}
            icon={Activity}
            color="bg-gradient-to-br from-orange-600 to-orange-700"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
          {["overview", "invest", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-md font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Performance Chart */}
                <div id="performance">
                  <PerformanceChartAdvanced period="30d" />
                </div>

                {/* Portfolio Allocation */}
                <div id="portfolio">
                  <PortfolioOverview />
                </div>
              </>
            )}

            {activeTab === "invest" && (
              <div id="invest">
                <InvestmentFlow />
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">
                  Transaction History
                </h2>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((tx, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-4 border-b border-gray-700 last:border-0"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-2 rounded-lg ${
                              tx.type === "deposit"
                                ? "bg-green-600/20"
                                : "bg-red-600/20"
                            }`}
                          >
                            {tx.type === "deposit" ? (
                              <TrendingUp className="w-5 h-5 text-green-400" />
                            ) : (
                              <RefreshCw className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium capitalize">
                              {tx.type}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {tx.timestamp?.toLocaleDateString() || "Today"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            {tx.amount} AVAX
                          </p>
                          <p className="text-gray-400 text-sm">{tx.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No transactions yet</p>
                    <p className="text-sm text-gray-500">
                      Your investment history will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {activeTab !== "invest" && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Quick Actions
                </h3>
                <InvestmentForm />
              </div>
            )}

            {/* Market Overview */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Market Overview
                </h3>
                {isLoadingYields && (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">AVAX Price</span>
                  <span className="text-white font-medium">
                    ${avaxPrice?.toFixed(2) || "45.23"}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">Aave APY</span>
                      <span className="text-green-400 font-medium">
                        {yields?.aave?.toFixed(1) || "5.2"}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-green-400 h-1.5 rounded-full"
                        style={{ width: "52%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">
                        TraderJoe APY
                      </span>
                      <span className="text-blue-400 font-medium">
                        {yields?.traderJoe?.toFixed(1) || "8.7"}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-400 h-1.5 rounded-full"
                        style={{ width: "87%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">
                        YieldYak APY
                      </span>
                      <span className="text-purple-400 font-medium">
                        {yields?.yieldYak?.toFixed(1) || "12.4"}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-purple-400 h-1.5 rounded-full"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total TVL</span>
                    <span className="text-white font-medium">
                      ${marketSummary?.[0]?.tvl || "2.4B"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium mb-1">Pro Tip</h4>
                  <p className="text-gray-300 text-sm">
                    Enable auto-rebalancing to maximize your yields across
                    protocols automatically.
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2">
                    Learn More →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
