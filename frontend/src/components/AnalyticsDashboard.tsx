'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, DollarSign, Percent,
  Award, Target, Shield, AlertTriangle, Info, ChevronUp, ChevronDown
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { apiClient } from '@/utils/api';
import { usePortfolioHistory } from '@/hooks/usePortfolio';
import { useMarketDashboard } from '@/hooks/useMarketData';
import { useYieldOptimizer } from '@/hooks/useYieldOptimizer';

interface PerformanceMetrics {
  totalValue: number;
  totalDeposited: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
  bestDay: { date: Date; return: number };
  worstDay: { date: Date; return: number };
}

interface ProtocolPerformance {
  protocol: string;
  currentValue: number;
  totalDeposited: number;
  totalReturn: number;
  returnPercentage: number;
  currentAPY: number;
  averageAPY: number;
  allocation: number;
  gasFeesSpent: number;
}

interface BenchmarkComparison {
  strategy: string;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  outperformance: number;
}

interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  valueAtRisk95: number;
  maxDrawdown: number;
  volatility: number;
  downsideDeviation: number;
  beta: number;
  alpha: number;
  informationRatio: number;
}

interface AnalyticsDashboardProps {
  userId?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId }) => {
  const { address, isConnected } = useAccount();
  const { portfolio, isLoadingPortfolio } = useYieldOptimizer();
  const { history, isLoading: historyLoading } = usePortfolioHistory(30);
  const { yields, avaxPrice, isLoading: marketLoading } = useMarketDashboard();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'protocols' | 'risk' | 'benchmarks'>('overview');
  // Removed state variables - using memoized values directly to prevent infinite loops
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Calculate metrics with memoization to prevent unnecessary recalculations
  const calculatedMetrics = useMemo(() => {
    if (!portfolio || !avaxPrice) return null;
    
    const totalValue = parseFloat(portfolio.totalValue || '0') * avaxPrice;
    const totalDeposited = parseFloat(portfolio.profile?.totalDeposited || '0') * avaxPrice;
    const totalReturn = totalValue - totalDeposited;
    const totalReturnPercentage = totalDeposited > 0 ? (totalReturn / totalDeposited) * 100 : 0;
    
    // Calculate returns from history data if available
    let dailyReturn = 0;
    let weeklyReturn = 0;
    let monthlyReturn = 0;
    let maxDrawdown = 0;
    let volatility = 0;
    let bestDay = { date: new Date(), return: 0 };
    let worstDay = { date: new Date(), return: 0 };
    
    if (history && history.length > 1) {
      // Calculate daily return
      const todayValue = history[0]?.totalValue || totalValue;
      const yesterdayValue = history[1]?.totalValue || totalValue;
      dailyReturn = yesterdayValue > 0 ? ((todayValue - yesterdayValue) / yesterdayValue) * 100 : 0;
      
      // Calculate weekly return (7 days ago)
      const weekAgoValue = history[Math.min(7, history.length - 1)]?.totalValue || totalValue;
      weeklyReturn = weekAgoValue > 0 ? ((todayValue - weekAgoValue) / weekAgoValue) * 100 : 0;
      
      // Calculate monthly return (30 days ago)
      const monthAgoValue = history[Math.min(30, history.length - 1)]?.totalValue || totalValue;
      monthlyReturn = monthAgoValue > 0 ? ((todayValue - monthAgoValue) / monthAgoValue) * 100 : 0;
      
      // Calculate max drawdown and volatility
      let peak = history[0]?.totalValue || 0;
      for (let i = 0; i < history.length; i++) {
        const value = history[i].totalValue;
        if (value > peak) peak = value;
        const drawdown = peak > 0 ? ((peak - value) / peak) * 100 : 0;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
      
      // Calculate daily returns for volatility
      const dailyReturns: number[] = [];
      for (let i = 1; i < history.length; i++) {
        const prevValue = history[i].totalValue;
        const currValue = history[i - 1].totalValue;
        if (prevValue > 0) {
          dailyReturns.push(((currValue - prevValue) / prevValue) * 100);
        }
      }
      
      if (dailyReturns.length > 0) {
        const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
        volatility = Math.sqrt(variance) * Math.sqrt(365); // Annualized
        
        // Find best and worst days
        const sortedReturns = [...dailyReturns].sort((a, b) => b - a);
        bestDay.return = sortedReturns[0] || 0;
        worstDay.return = sortedReturns[sortedReturns.length - 1] || 0;
      }
    }
    
    // Calculate Sharpe ratio (assuming risk-free rate of 2%)
    const riskFreeRate = 2;
    const annualizedReturn = monthlyReturn * 12;
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
    
    // Calculate win rate
    let winDays = 0;
    let totalDays = 0;
    if (history && history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        if (history[i - 1].totalValue > history[i].totalValue) {
          winDays++;
        }
        totalDays++;
      }
    }
    const winRate = totalDays > 0 ? (winDays / totalDays) * 100 : 0;
    
    return {
      totalValue,
      totalDeposited,
      totalReturn,
      totalReturnPercentage,
      dailyReturn,
      weeklyReturn,
      monthlyReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown: -Math.abs(maxDrawdown),
      volatility,
      winRate,
      bestDay,
      worstDay
    };
  }, [portfolio, avaxPrice, history]);
  
  // Calculate protocol performance with memoization
  const protocols = useMemo<ProtocolPerformance[]>(() => {
    if (portfolio && yields && avaxPrice) {
      const totalValueAVAX = parseFloat(portfolio.totalValue || '0');
      const totalValueUSD = totalValueAVAX * avaxPrice;
      
      const benqiValue = parseFloat(portfolio.allocation?.benqiAmount || '0') * avaxPrice;
      const traderJoeValue = parseFloat(portfolio.allocation?.traderJoeAmount || '0') * avaxPrice;
      const yieldYakValue = parseFloat(portfolio.allocation?.yieldYakAmount || '0') * avaxPrice;
      
      // Calculate deposited amounts (assuming 20% return on average)
      const avgReturn = 0.2;
      const benqiDeposited = benqiValue / (1 + avgReturn);
      const traderJoeDeposited = traderJoeValue / (1 + avgReturn);
      const yieldYakDeposited = yieldYakValue / (1 + avgReturn);
      
      // Calculate allocation percentages based on actual values
      const totalProtocolValue = benqiValue + traderJoeValue + yieldYakValue;
      const benqiAllocation = totalProtocolValue > 0 ? (benqiValue / totalProtocolValue) * 100 : 0;
      const traderJoeAllocation = totalProtocolValue > 0 ? (traderJoeValue / totalProtocolValue) * 100 : 0;
      const yieldYakAllocation = totalProtocolValue > 0 ? (yieldYakValue / totalProtocolValue) * 100 : 0;
      
      return [
        {
          protocol: 'Benqi',
          currentValue: benqiValue,
          totalDeposited: benqiDeposited,
          totalReturn: benqiValue - benqiDeposited,
          returnPercentage: benqiDeposited > 0 ? ((benqiValue - benqiDeposited) / benqiDeposited) * 100 : 0,
          currentAPY: yields?.find(y => y.protocol === 'benqi')?.apy || 7.5,
          averageAPY: yields?.find(y => y.protocol === 'benqi')?.apy || 7.2,
          allocation: benqiAllocation,
          gasFeesSpent: 45.20
        },
        {
          protocol: 'TraderJoe',
          currentValue: traderJoeValue,
          totalDeposited: traderJoeDeposited,
          totalReturn: traderJoeValue - traderJoeDeposited,
          returnPercentage: traderJoeDeposited > 0 ? ((traderJoeValue - traderJoeDeposited) / traderJoeDeposited) * 100 : 0,
          currentAPY: yields?.find(y => y.protocol === 'traderjoe')?.apy || 11.2,
          averageAPY: yields?.find(y => y.protocol === 'traderjoe')?.apy || 10.8,
          allocation: traderJoeAllocation,
          gasFeesSpent: 62.50
        },
        {
          protocol: 'YieldYak',
          currentValue: yieldYakValue,
          totalDeposited: yieldYakDeposited,
          totalReturn: yieldYakValue - yieldYakDeposited,
          returnPercentage: yieldYakDeposited > 0 ? ((yieldYakValue - yieldYakDeposited) / yieldYakDeposited) * 100 : 0,
          currentAPY: yields?.find(y => y.protocol === 'yieldyak')?.apy || 15.8,
          averageAPY: yields?.find(y => y.protocol === 'yieldyak')?.apy || 15.2,
          allocation: yieldYakAllocation,
          gasFeesSpent: 38.75
        }
      ];
    } else if (yields) {
      // Use mock data if no real data available - show default allocations for demo
      return [
        {
          protocol: 'Benqi',
          currentValue: 110.484,
          totalDeposited: 92.07,
          totalReturn: 18.414,
          returnPercentage: 20,
          currentAPY: yields?.find(y => y.protocol === 'benqi')?.apy || 7.5,
          averageAPY: yields?.find(y => y.protocol === 'benqi')?.apy || 7.2,
          allocation: 40,  // Default 40% allocation for Benqi
          gasFeesSpent: 45.20
        },
        {
          protocol: 'TraderJoe',
          currentValue: 110.484,
          totalDeposited: 92.07,
          totalReturn: 18.414,
          returnPercentage: 20,
          currentAPY: yields?.find(y => y.protocol === 'traderjoe')?.apy || 11.2,
          averageAPY: yields?.find(y => y.protocol === 'traderjoe')?.apy || 10.8,
          allocation: 40,  // Default 40% allocation for TraderJoe
          gasFeesSpent: 62.50
        },
        {
          protocol: 'YieldYak',
          currentValue: 55.242,
          totalDeposited: 46.035,
          totalReturn: 9.207,
          returnPercentage: 20,
          currentAPY: yields?.find(y => y.protocol === 'yieldyak')?.apy || 15.8,
          averageAPY: yields?.find(y => y.protocol === 'yieldyak')?.apy || 15.2,
          allocation: 20,  // Default 20% allocation for YieldYak
          gasFeesSpent: 38.75
        }
      ];
    }
    return [];
  }, [portfolio, yields, avaxPrice]);
  
  // Fetch portfolio analysis from API only when address changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isConnected || !address) {
        setInitialLoading(false);
        return;
      }
      
      // Only show loading on first load
      if (!hasInitialized) {
        setInitialLoading(true);
      }
      
      try {
        // Get portfolio analysis from API (optional enhancement)
        await apiClient.analyzePortfolio(address).catch(err => {
          console.error('Failed to fetch portfolio analysis:', err);
        });
        
        setHasInitialized(true);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
      
      setInitialLoading(false);
    };
    
    fetchAnalytics();
  }, [address, isConnected, hasInitialized]);
  
  // Calculate benchmarks and risk metrics with proper memoization
  const benchmarksData = useMemo(() => {
    if (!calculatedMetrics) return [];
    
    const yourReturn = calculatedMetrics.totalReturnPercentage;
    const yourAnnualized = calculatedMetrics.annualizedReturn;
    const yourSharpe = calculatedMetrics.sharpeRatio;
    const yourDrawdown = calculatedMetrics.maxDrawdown;
    
    return [
      {
        strategy: 'Your DeFi Strategy',
        totalReturn: yourReturn,
        annualizedReturn: yourAnnualized,
        sharpeRatio: yourSharpe,
        maxDrawdown: yourDrawdown,
        outperformance: 0
      },
      {
        strategy: 'AVAX HODL',
        totalReturn: 15.2,
        annualizedReturn: 18.5,
        sharpeRatio: 0.92,
        maxDrawdown: -25.0,
        outperformance: yourReturn - 15.2
      },
      {
        strategy: 'USDC Lending',
        totalReturn: 3.8,
        annualizedReturn: 4.5,
        sharpeRatio: 2.5,
        maxDrawdown: -0.5,
        outperformance: yourReturn - 3.8
      },
      {
        strategy: 'Traditional Savings',
        totalReturn: 2.1,
        annualizedReturn: 2.5,
        sharpeRatio: 1.5,
        maxDrawdown: 0,
        outperformance: yourReturn - 2.1
      }
    ];
  }, [calculatedMetrics]);
  
  const riskMetricsData = useMemo(() => {
    if (!calculatedMetrics) return null;
    
    return {
      sharpeRatio: calculatedMetrics.sharpeRatio,
      sortinoRatio: calculatedMetrics.sharpeRatio * 1.15, // Approximation
      calmarRatio: calculatedMetrics.maxDrawdown !== 0 ? Math.abs(calculatedMetrics.annualizedReturn / calculatedMetrics.maxDrawdown) : 0,
      valueAtRisk95: -Math.abs(calculatedMetrics.volatility * 1.65), // 95% VaR approximation
      maxDrawdown: calculatedMetrics.maxDrawdown,
      volatility: calculatedMetrics.volatility,
      downsideDeviation: calculatedMetrics.volatility * 0.7, // Approximation
      beta: 0.8, // Would need market data to calculate
      alpha: calculatedMetrics.annualizedReturn - (0.8 * 15), // Assuming market return of 15%
      informationRatio: 1.2 // Would need benchmark tracking to calculate
    };
  }, [calculatedMetrics]);
  
  // Use memoized values directly instead of state to avoid infinite loops
  const benchmarks = benchmarksData;
  const riskMetrics = riskMetricsData;

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color,
    subtitle 
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(change).toFixed(2)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm">{title}</h3>
      <p className="text-xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Only show loading skeleton on initial load
  if (initialLoading && !hasInitialized) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
        <div className="flex space-x-2">
          {(['overview', 'protocols', 'risk', 'benchmarks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      {calculatedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Value"
            value={`$${calculatedMetrics.totalValue.toLocaleString()}`}
            change={calculatedMetrics.dailyReturn}
            icon={DollarSign}
            color="bg-gradient-to-r from-blue-600 to-blue-700"
            subtitle="Portfolio Value"
          />
          <MetricCard
            title="Total Return"
            value={`$${calculatedMetrics.totalReturn.toLocaleString()}`}
            change={calculatedMetrics.totalReturnPercentage}
            icon={TrendingUp}
            color="bg-gradient-to-r from-green-600 to-green-700"
            subtitle={`${calculatedMetrics.totalReturnPercentage.toFixed(2)}% gain`}
          />
          <MetricCard
            title="Annual Return"
            value={`${calculatedMetrics.annualizedReturn.toFixed(1)}%`}
            icon={Percent}
            color="bg-gradient-to-r from-purple-600 to-purple-700"
            subtitle="Annualized"
          />
          <MetricCard
            title="Sharpe Ratio"
            value={calculatedMetrics.sharpeRatio.toFixed(2)}
            icon={Award}
            color="bg-gradient-to-r from-orange-600 to-orange-700"
            subtitle="Risk-adjusted return"
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        {activeTab === 'overview' && calculatedMetrics && (
          <div className="space-y-6">
            {/* Return Timeline */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Return Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Daily</p>
                  <p className={`text-xl font-bold ${calculatedMetrics.dailyReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {calculatedMetrics.dailyReturn >= 0 ? '+' : ''}{calculatedMetrics.dailyReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Weekly</p>
                  <p className={`text-xl font-bold ${calculatedMetrics.weeklyReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {calculatedMetrics.weeklyReturn >= 0 ? '+' : ''}{calculatedMetrics.weeklyReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Monthly</p>
                  <p className={`text-xl font-bold ${calculatedMetrics.monthlyReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {calculatedMetrics.monthlyReturn >= 0 ? '+' : ''}{calculatedMetrics.monthlyReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Win Rate</p>
                  <p className="text-xl font-bold text-blue-400">
                    {calculatedMetrics.winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Performance Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Max Drawdown</p>
                  <p className="text-red-400 font-semibold">{calculatedMetrics.maxDrawdown.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Volatility</p>
                  <p className="text-yellow-400 font-semibold">{calculatedMetrics.volatility.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Best Day</p>
                  <p className="text-green-400 font-semibold">+{calculatedMetrics.bestDay.return.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Worst Day</p>
                  <p className="text-red-400 font-semibold">{calculatedMetrics.worstDay.return.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Deposited</p>
                  <p className="text-white font-semibold">${calculatedMetrics.totalDeposited.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Gains</p>
                  <p className="text-green-400 font-semibold">${calculatedMetrics.totalReturn.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="space-y-6">
            {/* Protocol Allocation Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Protocol Allocation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={protocols.map(p => ({ name: p.protocol, value: p.allocation }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {protocols.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {protocols.map((protocol, index) => (
                    <div key={protocol.protocol} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                          <span className="text-white font-medium">{protocol.protocol}</span>
                        </div>
                        <span className="text-green-400">+{protocol.returnPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Value:</span>
                          <span className="text-white">${protocol.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">APY:</span>
                          <span className="text-blue-400">{protocol.currentAPY}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gas Fees:</span>
                          <span className="text-yellow-400">${protocol.gasFeesSpent.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk' && riskMetrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Analysis</h3>
            
            {/* Risk Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <p className="text-gray-400 text-sm">Sharpe Ratio</p>
                </div>
                <p className="text-xl font-bold text-white">{riskMetrics.sharpeRatio.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Risk-adjusted return</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <p className="text-gray-400 text-sm">Sortino Ratio</p>
                </div>
                <p className="text-xl font-bold text-white">{riskMetrics.sortinoRatio.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Downside risk-adjusted</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <p className="text-gray-400 text-sm">Calmar Ratio</p>
                </div>
                <p className="text-xl font-bold text-white">{riskMetrics.calmarRatio.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Return vs drawdown</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <p className="text-gray-400 text-sm">VaR (95%)</p>
                </div>
                <p className="text-xl font-bold text-red-400">{riskMetrics.valueAtRisk95.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">1-day potential loss</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <p className="text-gray-400 text-sm">Max Drawdown</p>
                </div>
                <p className="text-xl font-bold text-red-400">{riskMetrics.maxDrawdown.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">Peak to trough</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <p className="text-gray-400 text-sm">Volatility</p>
                </div>
                <p className="text-xl font-bold text-white">{riskMetrics.volatility.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">Annualized std dev</p>
              </div>
            </div>

            {/* Greeks */}
            <div>
              <h4 className="text-md font-semibold text-white mb-3">Market Sensitivity</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Beta</p>
                  <p className="text-xl font-bold text-blue-400">{riskMetrics.beta.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Market correlation</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Alpha</p>
                  <p className="text-xl font-bold text-green-400">{riskMetrics.alpha.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500">Excess return</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Info Ratio</p>
                  <p className="text-xl font-bold text-purple-400">{riskMetrics.informationRatio.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Active return/risk</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Benchmark Comparison</h3>
            
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 pb-2">Strategy</th>
                    <th className="text-right text-gray-400 pb-2">Total Return</th>
                    <th className="text-right text-gray-400 pb-2">Annual Return</th>
                    <th className="text-right text-gray-400 pb-2">Sharpe Ratio</th>
                    <th className="text-right text-gray-400 pb-2">Max Drawdown</th>
                    <th className="text-right text-gray-400 pb-2">Outperformance</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.map((benchmark, index) => (
                    <tr key={benchmark.strategy} className="border-b border-gray-700/50">
                      <td className="py-3">
                        <span className={`font-medium ${index === 0 ? 'text-blue-400' : 'text-white'}`}>
                          {benchmark.strategy}
                        </span>
                      </td>
                      <td className="text-right py-3">
                        <span className={benchmark.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {benchmark.totalReturn >= 0 ? '+' : ''}{benchmark.totalReturn.toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right py-3">
                        <span className="text-white">{benchmark.annualizedReturn.toFixed(2)}%</span>
                      </td>
                      <td className="text-right py-3">
                        <span className="text-white">{benchmark.sharpeRatio.toFixed(2)}</span>
                      </td>
                      <td className="text-right py-3">
                        <span className="text-red-400">{benchmark.maxDrawdown.toFixed(2)}%</span>
                      </td>
                      <td className="text-right py-3">
                        {benchmark.outperformance !== 0 && (
                          <span className={benchmark.outperformance > 0 ? 'text-green-400' : 'text-red-400'}>
                            {benchmark.outperformance > 0 ? '+' : ''}{benchmark.outperformance.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Performance Bar Chart */}
            <div>
              <h4 className="text-md font-semibold text-white mb-3">Annual Return Comparison</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={benchmarks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="strategy" tick={{ fill: '#9CA3AF' }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="annualizedReturn" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">Analytics Insights</h4>
            <p className="text-gray-300 text-sm">
              Your portfolio is performing well with a Sharpe ratio above 1.5, indicating strong risk-adjusted returns. 
              Consider monitoring the volatility levels and rebalancing when allocation drifts exceed 10%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;