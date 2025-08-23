"use client";

import { useAccount } from "wagmi";
import { useYieldOptimizer } from "../hooks/useYieldOptimizer";
import { useAVAXPrice } from "../hooks/useMarketData";
import { useRiskProfile } from "@/hooks/useRiskProfile";

interface PortfolioOverviewProps {
  className?: string;
}

export function PortfolioOverview({ className = "" }: PortfolioOverviewProps) {
  const { isConnected } = useAccount();
  const {
    portfolio,
    yields,
    rebalanceRec,
    portfolioMetrics,
    isLoadingPortfolio,
    isLoadingYields,
    lastRefreshTime,
    currentBlock,
  } = useYieldOptimizer();
  const { price: avaxPrice, isLoading: isPriceLoading } = useAVAXPrice();
  const { riskScore = 50, riskProfile } = useRiskProfile();

  const getRiskLevelName = (riskScore: number) => {
    if (riskScore <= 33) return "Conservative";
    if (riskScore <= 66) return "Balanced";
    return "Aggressive";
  };

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore <= 33) return "text-green-600";
    if (riskScore <= 66) return "text-blue-600";
    return "text-purple-600";
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (!avaxPrice) return "$0.00"; // Should never happen due to loading check
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num * avaxPrice);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Show loading state while fetching AVAX price
  if (isPriceLoading || !avaxPrice) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading market data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 ${className}`}
      >
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600">
            Connect your wallet to view your portfolio and start optimizing your
            yields
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Real-time Status Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Data</span>
            </div>
            {lastRefreshTime && (
              <span className="text-xs text-gray-500">
                Updated: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {currentBlock && (
              <div className="text-xs text-gray-500">
                Block: #{currentBlock.toString()}
              </div>
            )}
            {isLoadingPortfolio || isLoadingYields ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-xs text-gray-500">Syncing...</span>
              </div>
            ) : (
              <div className="text-xs text-green-600 font-medium">
                ✓ Synchronized
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">
            Total Portfolio Value
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {portfolioMetrics
              ? formatCurrency(portfolioMetrics.totalValue.toString())
              : isLoadingPortfolio
              ? "Loading..."
              : "$0.00"}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {portfolioMetrics && portfolioMetrics.returnPercentage > 0
              ? "+"
              : ""}
            {portfolioMetrics
              ? `${portfolioMetrics.returnPercentage.toFixed(2)}%`
              : isLoadingPortfolio
              ? "Loading..."
              : "0.00%"}{" "}
            return
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Total Deposited</div>
          <div className="text-2xl font-bold text-gray-900">
            {portfolioMetrics
              ? formatCurrency(portfolioMetrics.totalDeposited.toString())
              : isLoadingPortfolio
              ? "Loading..."
              : "$0.00"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Principal amount</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Total Earnings</div>
          <div
            className={`text-2xl font-bold ${
              portfolioMetrics && portfolioMetrics.totalEarnings >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {portfolioMetrics
              ? formatCurrency(portfolioMetrics.totalEarnings.toString())
              : isLoadingPortfolio
              ? "Loading..."
              : "$0.00"}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {portfolioMetrics
              ? `${portfolioMetrics.returnPercentage.toFixed(2)}% return`
              : isLoadingPortfolio
              ? "Loading..."
              : "0.00% return"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Risk Profile</div>
          <div
            className={`text-xl font-extrabold ${
              portfolio ? getRiskLevelColor(riskScore!) : "text-blue-600"
            }`}
          >
            {portfolio ? getRiskLevelName(riskScore!) : riskProfile || "--"}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Score: {portfolio?.profile?.riskScore || riskScore || 0}/100
            {portfolioMetrics &&
              portfolioMetrics.daysSinceLastRebalance >= 0 && (
                <div className="text-xs text-gray-400">
                  Rebalanced {portfolioMetrics.daysSinceLastRebalance}d ago
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Current Allocation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Current Allocation
          </h2>
          {isLoadingPortfolio && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Aave Allocation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Aave Lending</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {portfolio
                    ? `${formatCurrency(
                        portfolio.allocation.aaveAmount
                      )} (${Math.round(
                        (parseFloat(portfolio.allocation.aaveAmount) /
                          parseFloat(portfolio.totalValue)) *
                          100
                      )}%)`
                    : "$0.00 (0%)"}
                </div>
                <div className="text-sm text-green-600">
                  {yields
                    ? `${formatPercentage(yields.aave)} APY`
                    : "Loading..."}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: portfolio
                    ? `${
                        (parseFloat(portfolio.allocation.aaveAmount) /
                          parseFloat(portfolio.totalValue)) *
                        100
                      }%`
                    : "40%",
                }}
              />
            </div>
          </div>

          {/* TraderJoe Allocation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">TraderJoe LP</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {portfolio
                    ? `${formatCurrency(
                        portfolio.allocation.traderJoeAmount
                      )} (${Math.round(
                        (parseFloat(portfolio.allocation.traderJoeAmount) /
                          parseFloat(portfolio.totalValue)) *
                          100
                      )}%)`
                    : "$0.00 (0%)"}
                </div>
                <div className="text-sm text-blue-600">
                  {yields
                    ? `${formatPercentage(yields.traderJoe)} APY`
                    : "Loading..."}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: portfolio
                    ? `${
                        (parseFloat(portfolio.allocation.traderJoeAmount) /
                          parseFloat(portfolio.totalValue)) *
                        100
                      }%`
                    : "40%",
                }}
              />
            </div>
          </div>

          {/* YieldYak Allocation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-gray-900">
                  YieldYak Farms
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {portfolio
                    ? `${formatCurrency(
                        portfolio.allocation.yieldYakAmount
                      )} (${Math.round(
                        (parseFloat(portfolio.allocation.yieldYakAmount) /
                          parseFloat(portfolio.totalValue)) *
                          100
                      )}%)`
                    : "$0.00 (0%)"}
                </div>
                <div className="text-sm text-purple-600">
                  {yields
                    ? `${formatPercentage(yields.yieldYak)} APY`
                    : "Loading..."}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: portfolio
                    ? `${
                        (parseFloat(portfolio.allocation.yieldYakAmount) /
                          parseFloat(portfolio.totalValue)) *
                        100
                      }%`
                    : "20%",
                }}
              />
            </div>
          </div>
        </div>

        {/* Rebalancing Recommendation */}
        {rebalanceRec?.shouldRebalance && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-blue-900 mb-1">
                  Rebalancing Recommended
                </div>
                <div className="text-sm text-blue-700">
                  Market conditions suggest rebalancing your portfolio for
                  optimal returns.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {yields?.lastUpdated && (
          <div className="mt-4 text-xs text-gray-500">
            Yields last updated: {yields.lastUpdated.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
