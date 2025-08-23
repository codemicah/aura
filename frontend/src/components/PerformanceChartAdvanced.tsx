"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { useAVAXPrice } from "../hooks/useMarketData";
import { useYieldOptimizer } from "../hooks/useYieldOptimizer";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  Percent,
} from "lucide-react";

interface PerformanceData {
  date: string;
  portfolio: number;
  aave: number;
  traderjoe: number;
  yieldyak: number;
  benchmark: number;
}

interface PerformanceChartProps {
  period?: "7d" | "30d" | "90d" | "all";
  showBenchmark?: boolean;
  height?: number;
}

export default function PerformanceChartAdvanced({
  period = "30d",
  showBenchmark = true,
  height = 400,
}: PerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  // Fetch real data from hooks
  const { price: avaxPrice, isLoading: isPriceLoading } = useAVAXPrice();
  const { portfolio, portfolioMetrics } = useYieldOptimizer();

  // Extract stable values from portfolio to avoid reference changes
  const totalValueStr = portfolio?.totalValue || "0";
  const aaveAmount = portfolio?.allocation?.aaveAmount || "0";
  const traderJoeAmount = portfolio?.allocation?.traderJoeAmount || "0";
  const yieldYakAmount = portfolio?.allocation?.yieldYakAmount || "0";
  const totalEarnings = portfolioMetrics?.totalEarnings || 0;
  const returnPercentage = portfolioMetrics?.returnPercentage || 0;

  // Generate data based on real portfolio values using useMemo
  const { data, stats } = useMemo(() => {
    const days =
      selectedPeriod === "7d"
        ? 7
        : selectedPeriod === "30d"
        ? 30
        : selectedPeriod === "90d"
        ? 90
        : 364;
    const now = new Date();

    // Use real portfolio value or default to invested amount
    const currentValueAVAX = parseFloat(totalValueStr);
    const baseValue = currentValueAVAX * (avaxPrice || 0);

    const newData: PerformanceData[] = [];

    // If no portfolio data, show empty chart
    if (!portfolio || baseValue === 0 || !avaxPrice) {
      return {
        data: [],
        stats: {
          totalValue: 0,
          totalReturn: 0,
          percentReturn: 0,
          isPositive: true,
        },
      };
    }

    // Generate historical data based on current value
    // Note: In production, this should fetch actual historical data from backend
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Show actual portfolio value (no simulated growth)
      // Real historical data should come from backend
      const currentValue = baseValue;

      // Use real allocation if available, otherwise use defaults based on risk
      let aaveAllocation = 0.4;
      let traderjoeAllocation = 0.4;
      let yieldyakAllocation = 0.2;

      const totalAVAX = parseFloat(totalValueStr);
      if (totalAVAX > 0) {
        aaveAllocation = parseFloat(aaveAmount) / totalAVAX;
        traderjoeAllocation = parseFloat(traderJoeAmount) / totalAVAX;
        yieldyakAllocation = parseFloat(yieldYakAmount) / totalAVAX;
      }

      newData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        portfolio: Math.round(currentValue * 100) / 100,
        aave: Math.round(currentValue * aaveAllocation * 100) / 100,
        traderjoe: Math.round(currentValue * traderjoeAllocation * 100) / 100,
        yieldyak: Math.round(currentValue * yieldyakAllocation * 100) / 100,
        benchmark:
          Math.round(baseValue * Math.pow(1.001, days - i) * 100) / 100, // 0.1% daily benchmark
      });
    }

    // Calculate statistics using real portfolio metrics if available
    const latestValue = baseValue; // Use actual portfolio value
    const firstValue = baseValue; // Since we don't have historical data, assume same value

    // Use real metrics if available from portfolio
    const totalReturn = totalEarnings * avaxPrice || 0; // Use actual earnings
    const percentReturn = returnPercentage || 0; // Use actual return percentage

    return {
      data: newData,
      stats: {
        totalValue: latestValue,
        totalReturn,
        percentReturn,
        isPositive: totalReturn >= 0,
      },
    };
  }, [
    selectedPeriod,
    totalValueStr,
    aaveAmount,
    traderJoeAmount,
    yieldYakAmount,
    totalEarnings,
    returnPercentage,
    avaxPrice,
  ]);

  // Show loading state if price is not available - MUST come after all hooks
  if (isPriceLoading || !avaxPrice) {
    return (
      <div
        className="bg-gray-900 rounded-xl border border-gray-800 p-6"
        style={{ height }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Defensive: If no data, show a message instead of rendering chart
  // if (!data || data.length === 0) {
  //   return (
  //     <div
  //       className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex items-center justify-center"
  //       style={{ height }}
  //     >
  //       <p className="text-gray-500 text-sm">
  //         No performance data available for this period.
  //       </p>
  //     </div>
  //   );
  // }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between space-x-4">
            <span className="text-blue-400 text-sm">Portfolio:</span>
            <span className="text-white font-medium">
              ${payload[0]?.value?.toFixed(2)}
            </span>
          </div>
          {showBenchmark && payload[4] && (
            <div className="flex items-center justify-between space-x-4">
              <span className="text-gray-400 text-sm">Benchmark:</span>
              <span className="text-gray-300">
                ${payload[4]?.value?.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const periodOptions = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            Portfolio Performance
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-2xl font-bold text-white">
                $
                {stats.totalValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div
              className={`flex items-center space-x-1 ${
                stats.isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {stats.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : stats.totalReturn === 0 ? (
                <Minus className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {stats.isPositive ? "+" : ""}
                {stats.percentReturn.toFixed(2)}%
              </span>
              <span className="text-gray-400 text-sm">
                ({stats.isPositive ? "+" : ""}$
                {Math.abs(stats.totalReturn).toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedPeriod(option.value as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === option.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="aaveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="traderjoeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="yieldyakGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A855F7" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#A855F7" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

          <XAxis
            dataKey="date"
            stroke="#6B7280"
            fontSize={12}
            tickMargin={10}
          />

          <YAxis
            stroke="#6B7280"
            fontSize={12}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Stacked Areas for Protocol Allocation */}
          <Area
            type="monotone"
            dataKey="aave"
            stackId="1"
            stroke="#10B981"
            fill="url(#aaveGradient)"
            strokeWidth={0}
          />
          <Area
            type="monotone"
            dataKey="traderjoe"
            stackId="1"
            stroke="#F59E0B"
            fill="url(#traderjoeGradient)"
            strokeWidth={0}
          />
          <Area
            type="monotone"
            dataKey="yieldyak"
            stackId="1"
            stroke="#A855F7"
            fill="url(#yieldyakGradient)"
            strokeWidth={0}
          />

          {/* Benchmark Line */}
          {showBenchmark && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#6B7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}

          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="rect"
            formatter={(value) => {
              const labels: Record<string, string> = {
                aave: "Aave",
                traderjoe: "Trader Joe",
                yieldyak: "Yield Yak",
                benchmark: "Benchmark",
              };
              return labels[value] || value;
            }}
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "12px",
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Protocol Allocation Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Aave</span>
            <span className="text-green-400 text-sm font-medium">40%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full"
              style={{ width: "40%" }}
            />
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Trader Joe</span>
            <span className="text-amber-400 text-sm font-medium">40%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full"
              style={{ width: "40%" }}
            />
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm">Yield Yak</span>
            <span className="text-purple-400 text-sm font-medium">20%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className="bg-purple-400 h-2 rounded-full"
              style={{ width: "20%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
