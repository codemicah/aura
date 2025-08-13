"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";
import { useAIFlow } from "@/hooks/useAI";
import { useMarketDashboard } from "@/hooks/useMarketData";
import { usePortfolioDashboard } from "@/hooks/usePortfolio";

export function InvestmentFlow() {
  const { address, isConnected } = useAccount();
  const {
    invest,
    withdraw,
    rebalance,
    isOptimizing,
    isRebalancing,
    isWithdrawing,
    optimizeError,
    rebalanceError,
    withdrawError,
  } = useYieldOptimizer();
  const aiFlow = useAIFlow();
  const market = useMarketDashboard();
  const portfolio = usePortfolioDashboard();

  const [activeTab, setActiveTab] = useState<
    "invest" | "withdraw" | "rebalance"
  >("invest");
  const [amount, setAmount] = useState("");
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string }>
  >([]);

  // Get AI recommendations when portfolio changes
  useEffect(() => {
    if (
      portfolio.portfolio &&
      aiFlow.recommendations.getRecommendation &&
      portfolio.metrics?.totalValueUSD !== undefined
    ) {
      aiFlow.recommendations.getRecommendation(portfolio.metrics.totalValueUSD);
    }
  }, [
    portfolio.metrics?.totalValueUSD,
    portfolio.portfolio,
    aiFlow.recommendations.getRecommendation,
  ]);

  const addNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const handleInvest = async () => {
    if (!amount || !aiFlow.allocation.allocation) return;

    try {
      await invest(amount, aiFlow.riskAssessment.riskScore || 50);
      addNotification("success", `Investment of ${amount} AVAX initiated`);

      // Refresh portfolio after transaction
      setTimeout(() => {
        portfolio.refresh();
        market.refreshAll();
      }, 5000);
    } catch (error) {
      console.error("Investment failed:", error);
      addNotification("error", "Investment failed. Please try again.");
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdraw();
      addNotification("success", "Emergency withdrawal initiated");

      setTimeout(() => {
        portfolio.refresh();
      }, 5000);
    } catch (error) {
      console.error("Withdrawal failed:", error);
      addNotification("error", "Withdrawal failed. Please try again.");
    }
  };

  const handleRebalance = async () => {
    if (!aiFlow.allocation.allocation) return;

    try {
      await rebalance();
      addNotification("success", "Portfolio rebalancing initiated");

      setTimeout(() => {
        portfolio.refresh();
        aiFlow.portfolio.refreshAnalysis();
      }, 5000);
    } catch (error) {
      console.error("Rebalance failed:", error);
      addNotification("error", "Rebalancing failed. Please try again.");
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please connect your wallet to continue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* AI Recommendation Banner */}
      {aiFlow.recommendations.recommendation && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {aiFlow.recommendations.recommendation.title}
              </h3>
              <p className="mt-1 text-gray-600">
                {aiFlow.recommendations.recommendation.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  Confidence:{" "}
                  {Math.round(
                    aiFlow.recommendations.recommendation.confidence * 100
                  )}
                  %
                </span>
                {aiFlow.recommendations.recommendation.expectedReturn !==
                  undefined && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Expected Return:{" "}
                    {aiFlow.recommendations.recommendation.expectedReturn.toFixed(
                      1
                    )}
                    %
                  </span>
                )}
                <span
                  className={`px-2 py-1 rounded-full ${
                    aiFlow.recommendations.recommendation.riskLevel === "low"
                      ? "bg-green-100 text-green-700"
                      : aiFlow.recommendations.recommendation.riskLevel ===
                        "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  Risk: {aiFlow.recommendations.recommendation.riskLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 font-medium">AVAX Price</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            ${market.avaxPrice?.toFixed(2) || "--"}
          </div>
          {market.avaxChange24h !== null &&
            market.avaxChange24h !== undefined && (
              <div
                className={`text-sm mt-1 ${
                  market.avaxChange24h >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {market.avaxChange24h >= 0 ? "+" : ""}
                {market.avaxChange24h.toFixed(2)}%
              </div>
            )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 font-medium">Average APY</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {market.averageAPY !== undefined
              ? `${market.averageAPY.toFixed(1)}%`
              : "--"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Across protocols</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 font-medium">Best Yield</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {market.bestYield?.apy !== undefined
              ? `${market.bestYield.apy.toFixed(1)}%`
              : "--"}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {market.bestYield?.protocol || "--"}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 font-medium">
            Portfolio Value
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            ${portfolio.metrics?.totalValueUSD?.toFixed(2) || "0.00"}
          </div>
          <div
            className={`text-sm mt-1 ${
              (portfolio.metrics?.dailyReturn || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {(portfolio.metrics?.dailyReturn || 0) >= 0 ? "+" : ""}
            {(portfolio.metrics?.dailyReturn || 0).toFixed(2)}% today
          </div>
        </div>
      </div>

      {/* Investment Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {(["invest", "withdraw", "rebalance"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "invest" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Investment Amount (AVAX)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {aiFlow.allocation.allocation && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-3">
                    Allocation Strategy
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        Benqi (Stable Lending)
                      </span>
                      <span className="font-semibold text-gray-900">
                        {aiFlow.allocation.allocation.benqi}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        TraderJoe (Liquidity Pool)
                      </span>
                      <span className="font-semibold text-gray-900">
                        {aiFlow.allocation.allocation.traderJoe}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        YieldYak (Yield Farming)
                      </span>
                      <span className="font-semibold text-gray-900">
                        {aiFlow.allocation.allocation.yieldYak}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">
                        Expected APY
                      </span>
                      <span className="font-bold text-green-600">
                        {aiFlow.allocation.allocation.expectedAPY
                          ? (
                              aiFlow.allocation.allocation.expectedAPY * 100
                            ).toFixed(2)
                          : "--"}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleInvest}
                disabled={
                  !amount || isOptimizing || !aiFlow.allocation.allocation
                }
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isOptimizing ? "Processing..." : "Invest Now"}
              </button>
            </div>
          )}

          {activeTab === "withdraw" && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Emergency withdrawal will retrieve all your funds from all
                  protocols. This action cannot be undone.
                </p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? "Processing..." : "Withdraw"}
              </button>
            </div>
          )}

          {activeTab === "rebalance" && (
            <div className="space-y-4">
              {portfolio.portfolio && aiFlow.allocation.allocation && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">
                      Current vs Recommended Allocation
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700 font-medium">Benqi</span>
                        <span className="text-gray-900 font-semibold">
                          {portfolio.portfolio.allocation?.benqiPercentage?.toFixed(
                            1
                          ) || "0.0"}
                          % → {aiFlow.allocation.allocation.benqi}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 font-medium">
                          TraderJoe
                        </span>
                        <span className="text-gray-900 font-semibold">
                          {portfolio.portfolio.allocation?.traderJoePercentage?.toFixed(
                            1
                          ) || "0.0"}
                          % → {aiFlow.allocation.allocation.traderJoe}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 font-medium">
                          YieldYak
                        </span>
                        <span className="text-gray-900 font-semibold">
                          {portfolio.portfolio.allocation?.yieldYakPercentage?.toFixed(
                            1
                          ) || "0.0"}
                          % → {aiFlow.allocation.allocation.yieldYak}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRebalance}
                    disabled={isRebalancing}
                    className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRebalancing ? "Processing..." : "Rebalance Portfolio"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg max-w-sm ${
                notification.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : notification.type === "error"
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <p
                className={`text-sm ${
                  notification.type === "success"
                    ? "text-green-800"
                    : notification.type === "error"
                    ? "text-red-800"
                    : "text-blue-800"
                }`}
              >
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
