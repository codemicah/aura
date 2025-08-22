"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { ConnectButton } from "../../src/components/ConnectButton";
import { RiskAssessment } from "../../src/components/RiskAssessment";
import Header from "../../src/components/Header";
import { useAccount } from "wagmi";
import { useRiskProfile } from "../../src/hooks/useRiskProfile";
import {
  TrendingUp,
  Shield,
  Target,
  Edit2,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

function RiskProfileContent() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { hasProfile, riskScore, riskProfile, clearProfile } = useRiskProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Profile data is now loaded from server via useRiskProfile hook
  useEffect(() => {
    if (riskScore && riskProfile) {
      setProfileData({ riskScore, riskProfile });
    }
  }, [riskScore, riskProfile]);

  const handleRiskAssessmentComplete = (data: any) => {
    setProfileData(data);
    setIsEditing(false);

    // Set cookie to indicate profile completion
    document.cookie = `hasRiskProfile=true; path=/; max-age=${
      60 * 60 * 24 * 30
    }`;

    // Refresh the page to update the profile display
    window.location.reload();
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const getRiskLevelColor = (score: number) => {
    if (score <= 33) return "text-green-600 bg-green-50 border-green-200";
    if (score <= 66) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-purple-600 bg-purple-50 border-purple-200";
  };

  const getRiskLevelName = (score: number) => {
    if (score <= 33) return "Conservative";
    if (score <= 66) return "Balanced";
    return "Aggressive";
  };

  const getRiskLevelDescription = (score: number) => {
    if (score <= 33)
      return "Your strategy focuses on capital preservation with stable, lower-risk yields";
    if (score <= 66)
      return "Your strategy balances growth and stability with moderate risk exposure";
    return "Your strategy maximizes growth potential with higher risk tolerance";
  };

  const getAllocationStrategy = (score: number) => {
    if (score <= 33) return { aave: 70, traderjoe: 30, yieldyak: 0 };
    if (score <= 66) return { aave: 40, traderjoe: 40, yieldyak: 20 };
    return { aave: 20, traderjoe: 30, yieldyak: 50 };
  };

  const getExpectedReturns = (score: number) => {
    if (score <= 33) return { min: 4.5, avg: 6.5, max: 8.5 };
    if (score <= 66) return { min: 6.0, avg: 8.8, max: 11.5 };
    return { min: 8.0, avg: 11.2, max: 15.0 };
  };

  // Show assessment form if editing or no profile exists
  if (isEditing || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {profileData
                ? "Update Your Risk Profile"
                : "Create Your Risk Profile"}
            </h1>
            <p className="text-xl text-gray-600">
              {profileData
                ? "Adjust your investment strategy by updating your risk assessment."
                : "Answer a few questions to help our AI create the perfect investment strategy for you."}
            </p>
          </div>

          <RiskAssessment onComplete={handleRiskAssessmentComplete} />

          {profileData && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Show profile display
  const currentScore = profileData?.riskScore || 50;
  const allocation = getAllocationStrategy(currentScore);
  const returns = getExpectedReturns(currentScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your Risk Profile
          </h1>
          <p className="text-xl text-gray-600">
            Your personalized investment strategy based on your financial goals
            and risk tolerance
          </p>
        </div>

        {/* Risk Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getRiskLevelColor(
                  currentScore
                )} mb-4`}
              >
                <Shield className="w-4 h-4 mr-2" />
                {getRiskLevelName(currentScore)} Investor
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Risk Score: {currentScore}/100
              </h2>
              <p className="text-gray-600 max-w-2xl">
                {getRiskLevelDescription(currentScore)}
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          {/* Risk Score Visualization */}
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-xs font-semibold inline-block text-green-600">
                Conservative
              </div>
              <div className="text-xs font-semibold inline-block text-blue-600">
                Balanced
              </div>
              <div className="text-xs font-semibold inline-block text-purple-600">
                Aggressive
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
              <div
                style={{ width: `${currentScore}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                  currentScore <= 33
                    ? "bg-green-500"
                    : currentScore <= 66
                    ? "bg-blue-500"
                    : "bg-purple-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Allocation Strategy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Recommended Portfolio Allocation
          </h3>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {[
              {
                name: "Aave Lending",
                percentage: allocation.aave,
                color: "bg-green-500",
                icon: "🏦",
                description: "Stable lending yields with low risk",
                apy: "4-7%",
              },
              {
                name: "TraderJoe LP",
                percentage: allocation.traderjoe,
                color: "bg-blue-500",
                icon: "💧",
                description: "Liquidity provision with trading fees",
                apy: "8-12%",
              },
              {
                name: "YieldYak Farms",
                percentage: allocation.yieldyak,
                color: "bg-purple-500",
                icon: "🌾",
                description: "Auto-compounding yield farming",
                apy: "10-20%",
              },
            ].map((protocol) => (
              <div key={protocol.name} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{protocol.icon}</span>
                  <span
                    className={`text-2xl font-bold ${
                      protocol.percentage > 0
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {protocol.percentage}%
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {protocol.name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {protocol.description}
                </p>
                <div className="text-xs font-medium text-green-600">
                  APY: {protocol.apy}
                </div>

                {/* Allocation Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${protocol.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${protocol.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  This allocation is optimized for your{" "}
                  {getRiskLevelName(currentScore).toLowerCase()} risk profile
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  The strategy automatically rebalances based on market
                  conditions and protocol performance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Returns */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Expected Annual Returns
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Conservative Estimate</span>
                <span className="text-xl font-bold text-gray-900">
                  {returns.min}% APY
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Average Expected</span>
                <span className="text-2xl font-bold text-green-600">
                  {returns.avg}% APY
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Best Case Scenario</span>
                <span className="text-xl font-bold text-gray-900">
                  {returns.max}% APY
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  {returns.avg}x better than traditional savings (0.1% APY)
                </span>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Profile Summary
            </h3>

            <div className="space-y-3">
              {profileData &&
                [
                  { label: "Age Group", value: profileData.age },
                  { label: "Income Range", value: profileData.income },
                  { label: "Monthly Expenses", value: profileData.expenses },
                  {
                    label: "Investment Goal",
                    value: profileData.goal?.replace("_", " "),
                  },
                  {
                    label: "Time Horizon",
                    value: `${profileData.timeHorizon} years`,
                  },
                  { label: "DeFi Experience", value: profileData.experience },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2"
                    >
                      <span className="text-sm text-gray-600">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {item.value}
                      </span>
                    </div>
                  ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RiskProfile() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your risk profile...</p>
            </div>
          </div>
        }
      >
        <RiskProfileContent />
      </Suspense>
    </ProtectedRoute>
  );
}
