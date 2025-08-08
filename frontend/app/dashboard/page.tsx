'use client'

import Link from "next/link"
import { ConnectButton } from "../../src/components/ConnectButton"
import { PortfolioOverview } from "../../src/components/PortfolioOverview"
import { InvestmentForm } from "../../src/components/InvestmentForm"
import { useYieldOptimizer } from "../../src/hooks/useYieldOptimizer"

export default function Dashboard() {
  const { yields, isLoadingYields } = useYieldOptimizer()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DeFi</span>
              </div>
              <span className="font-semibold text-gray-900">Dashboard</span>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Portfolio Overview</h1>
          <PortfolioOverview />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Content */}
          <div className="lg:col-span-2">
            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Chart</h2>
              <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p className="text-gray-600">Performance chart coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Track your portfolio growth over time</p>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Transactions</h2>
              <div className="space-y-4">
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500">Your investment history will appear here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Form */}
            <InvestmentForm />

            {/* Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">24h</span>
                  <span className="text-green-600 font-medium">+5.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">7d</span>
                  <span className="text-green-600 font-medium">+12.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">30d</span>
                  <span className="text-green-600 font-medium">+28.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">All Time</span>
                  <span className="text-green-600 font-medium">+67.2%</span>
                </div>
              </div>
            </div>

            {/* Market Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Market Status</h3>
                {isLoadingYields && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AVAX Price</span>
                  <span className="font-medium">$45.23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Benqi APY</span>
                  {isLoadingYields ? (
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-green-600 font-medium">
                      {yields ? `${yields.benqi.toFixed(1)}%` : '5.2%'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">TraderJoe APY</span>
                  {isLoadingYields ? (
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-blue-600 font-medium">
                      {yields ? `${yields.traderJoe.toFixed(1)}%` : '8.7%'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">YieldYak APY</span>
                  {isLoadingYields ? (
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-purple-600 font-medium">
                      {yields ? `${yields.yieldYak.toFixed(1)}%` : '12.4%'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">TVL</span>
                  <span className="font-medium">$2.4B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}