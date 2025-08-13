'use client'

import { useState, useEffect } from 'react'
import { usePortfolioHistory } from '@/hooks/usePortfolio'

interface ChartData {
  date: string
  value: number
  benqi: number
  traderJoe: number
  yieldYak: number
}

export function PerformanceChart() {
  const { history, isLoading, error } = usePortfolioHistory(30)
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30)
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    if (history && history.length > 0) {
      const formattedData = history.slice(-selectedPeriod).map(entry => ({
        date: entry.date,
        value: entry.totalValue,
        benqi: entry.allocation.benqi,
        traderJoe: entry.allocation.traderJoe,
        yieldYak: entry.allocation.yieldYak
      }))
      setChartData(formattedData)
    }
  }, [history, selectedPeriod])

  const calculateMetrics = () => {
    if (chartData.length < 2) return { change: 0, percentage: 0, trend: 'neutral' }
    
    const firstValue = chartData[0].value
    const lastValue = chartData[chartData.length - 1].value
    const change = lastValue - firstValue
    const percentage = (change / firstValue) * 100
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    
    return { change, percentage, trend }
  }

  const metrics = calculateMetrics()
  const maxValue = Math.max(...chartData.map(d => d.value), 1)
  const minValue = Math.min(...chartData.map(d => d.value), 0)
  const range = maxValue - minValue || 1

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-red-600">Failed to load performance data</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-2xl font-bold ${
              metrics.trend === 'up' ? 'text-green-600' : 
              metrics.trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {metrics.percentage >= 0 ? '+' : ''}{metrics.percentage.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">
              {selectedPeriod} day change
            </span>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {([7, 30, 90] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period}D
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        {chartData.length > 0 ? (
          <>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
              <span>${(maxValue / 1000).toFixed(1)}k</span>
              <span>${((maxValue + minValue) / 2000).toFixed(1)}k</span>
              <span>${(minValue / 1000).toFixed(1)}k</span>
            </div>

            {/* Chart area */}
            <div className="ml-12 h-full relative">
              <svg className="w-full h-full" viewBox={`0 0 ${chartData.length * 20} 100`} preserveAspectRatio="none">
                {/* Grid lines */}
                <g className="text-gray-200">
                  <line x1="0" y1="0" x2={chartData.length * 20} y2="0" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2={chartData.length * 20} y2="50" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="0" y1="100" x2={chartData.length * 20} y2="100" stroke="currentColor" strokeWidth="0.5" />
                </g>

                {/* Area chart */}
                <path
                  d={`
                    M 0,${100 - ((chartData[0].value - minValue) / range) * 100}
                    ${chartData.map((d, i) => 
                      `L ${i * 20},${100 - ((d.value - minValue) / range) * 100}`
                    ).join(' ')}
                    L ${(chartData.length - 1) * 20},100
                    L 0,100
                    Z
                  `}
                  fill="url(#gradient)"
                  opacity="0.3"
                />

                {/* Line chart */}
                <polyline
                  points={chartData.map((d, i) => 
                    `${i * 20},${100 - ((d.value - minValue) / range) * 100}`
                  ).join(' ')}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />

                {/* Data points */}
                {chartData.map((d, i) => (
                  <circle
                    key={i}
                    cx={i * 20}
                    cy={100 - ((d.value - minValue) / range) * 100}
                    r="3"
                    fill="#3B82F6"
                    className="hover:r-4 transition-all"
                  />
                ))}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                {chartData.filter((_, i) => i % Math.ceil(chartData.length / 5) === 0).map((d, i) => (
                  <span key={i}>{new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No data available for the selected period
          </div>
        )}
      </div>

      {/* Allocation breakdown */}
      {chartData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-3">Current Allocation</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {chartData[chartData.length - 1].benqi.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Benqi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {chartData[chartData.length - 1].traderJoe.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">TraderJoe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {chartData[chartData.length - 1].yieldYak.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">YieldYak</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}