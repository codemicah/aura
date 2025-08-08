'use client'

import { useState } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { ConnectButton } from "../../src/components/ConnectButton"
import { RiskAssessment } from "../../src/components/RiskAssessment"

export default function Onboarding() {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [riskProfile, setRiskProfile] = useState<any>(null)

  const handleRiskAssessmentComplete = (data: any) => {
    setRiskProfile(data)
    setIsCompleted(true)
    
    // Store in localStorage for now (later we'll use proper state management)
    localStorage.setItem('riskProfile', JSON.stringify(data))
  }

  const handleContinueToDashboard = () => {
    router.push('/dashboard')
  }

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore <= 33) return 'text-green-600 bg-green-50 border-green-200'
    if (riskScore <= 66) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-purple-600 bg-purple-50 border-purple-200'
  }

  const getRiskLevelName = (riskScore: number) => {
    if (riskScore <= 33) return 'Conservative'
    if (riskScore <= 66) return 'Balanced'
    return 'Aggressive'
  }

  const getAllocationStrategy = (riskScore: number) => {
    if (riskScore <= 33) return { benqi: 70, traderjoe: 30, yieldyak: 0 }
    if (riskScore <= 66) return { benqi: 40, traderjoe: 40, yieldyak: 20 }
    return { benqi: 20, traderjoe: 30, yieldyak: 50 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DeFi</span>
              </div>
              <span className="font-semibold text-gray-900">Personal DeFi Wealth Manager</span>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isCompleted ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Let's Build Your Financial Profile
              </h1>
              <p className="text-xl text-gray-600">
                Answer a few questions to help our AI create the perfect investment strategy for you.
              </p>
            </div>

            <RiskAssessment onComplete={handleRiskAssessmentComplete} />
          </>
        ) : (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Your Financial Profile is Complete!
              </h1>
              <p className="text-xl text-gray-600">
                Based on your answers, we've created a personalized investment strategy.
              </p>
            </div>

            {/* Risk Profile Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold border ${getRiskLevelColor(riskProfile.riskScore)}`}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {getRiskLevelName(riskProfile.riskScore)} Risk Profile
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900">Risk Score: {riskProfile.riskScore}/100</div>
                </div>
              </div>

              {/* Recommended Allocation */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Your Recommended Allocation Strategy
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {(() => {
                    const allocation = getAllocationStrategy(riskProfile.riskScore)
                    return [
                      { name: 'Benqi Lending', percentage: allocation.benqi, color: 'bg-green-500', description: 'Stable lending yields' },
                      { name: 'TraderJoe LP', percentage: allocation.traderjoe, color: 'bg-blue-500', description: 'Liquidity provision' },
                      { name: 'YieldYak Farms', percentage: allocation.yieldyak, color: 'bg-purple-500', description: 'Auto-compounding farms' }
                    ].map((protocol) => (
                      <div key={protocol.name} className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <div className={`w-12 h-12 rounded-full ${protocol.color} flex items-center justify-center`}>
                            <span className="text-white font-bold text-lg">{protocol.percentage}%</span>
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">{protocol.name}</div>
                        <div className="text-sm text-gray-600">{protocol.description}</div>
                      </div>
                    ))
                  })()}
                </div>
              </div>

              {/* Expected Returns */}
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Estimated Annual Returns</div>
                  <div className="text-2xl font-bold text-green-600">
                    {riskProfile.riskScore <= 33 ? '6.5%' : 
                     riskProfile.riskScore <= 66 ? '8.8%' : '11.2%'} APY
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    vs 0.1% in traditional savings accounts
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-center">
              <div className="space-y-4">
                <button
                  onClick={handleContinueToDashboard}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
                >
                  Continue to Dashboard
                </button>
                <div>
                  <button
                    onClick={() => setIsCompleted(false)}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    Retake Assessment
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}