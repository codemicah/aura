'use client'

import { useState, useEffect } from 'react'
import { CONTRACT_CONSTANTS } from '../config/contracts'
import { useRiskAssessment } from '@/hooks/useAI'
import { RiskAssessmentAnswers } from '@/types/ai'

interface RiskAssessmentData {
  age: string
  income: string
  expenses: string
  goal: string
  riskTolerance: string
  experience: string
  timeHorizon: string
  liquidityNeed: string
}

interface RiskAssessmentProps {
  onComplete: (data: RiskAssessmentData & { riskScore: number; riskProfile: string }) => void
  className?: string
}

export function RiskAssessment({ onComplete, className = '' }: RiskAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<RiskAssessmentData>({
    age: '',
    income: '',
    expenses: '',
    goal: '',
    riskTolerance: '',
    experience: ''
  })

  const steps = [
    {
      title: "Personal Information",
      question: "What's your age range?",
      field: 'age' as keyof RiskAssessmentData,
      options: [
        { value: '18-25', label: '18-25', points: 25 },
        { value: '26-35', label: '26-35', points: 20 },
        { value: '36-50', label: '36-50', points: 15 },
        { value: '50+', label: '50+', points: 10 }
      ]
    },
    {
      title: "Income & Expenses",
      question: "What's your monthly income range?",
      field: 'income' as keyof RiskAssessmentData,
      options: [
        { value: 'under-3k', label: '< $3,000', points: 5 },
        { value: '3k-7k', label: '$3,000 - $7,000', points: 15 },
        { value: 'over-7k', label: '$7,000+', points: 25 }
      ]
    },
    {
      title: "Monthly Expenses",
      question: "What percentage of your income goes to expenses?",
      field: 'expenses' as keyof RiskAssessmentData,
      options: [
        { value: 'over-80', label: 'More than 80%', points: 5 },
        { value: '60-80', label: '60% - 80%', points: 10 },
        { value: '40-60', label: '40% - 60%', points: 20 },
        { value: 'under-40', label: 'Less than 40%', points: 25 }
      ]
    },
    {
      title: "Financial Goals",
      question: "What's your primary financial goal?",
      field: 'goal' as keyof RiskAssessmentData,
      options: [
        { value: 'emergency', label: 'Build an emergency fund', points: 5 },
        { value: 'purchase', label: 'Save for a major purchase', points: 10 },
        { value: 'retirement', label: 'Grow wealth for retirement', points: 20 },
        { value: 'income', label: 'Generate passive income', points: 25 }
      ]
    },
    {
      title: "Risk Tolerance",
      question: "How do you feel about investment risk?",
      field: 'riskTolerance' as keyof RiskAssessmentData,
      options: [
        { value: 'conservative', label: 'I prefer stable returns, even if lower', points: 5 },
        { value: 'balanced', label: 'I want moderate risk for better returns', points: 15 },
        { value: 'aggressive', label: 'I\'m comfortable with high risk for maximum returns', points: 25 }
      ]
    },
    {
      title: "DeFi Experience",
      question: "How familiar are you with DeFi protocols?",
      field: 'experience' as keyof RiskAssessmentData,
      options: [
        { value: 'none', label: 'New to DeFi - I prefer simple strategies', points: 5 },
        { value: 'some', label: 'Some experience - I understand basic concepts', points: 15 },
        { value: 'experienced', label: 'Very experienced - I\'m comfortable with complex strategies', points: 25 }
      ]
    }
  ]

  const currentStepData = steps[currentStep]

  const handleOptionSelect = (value: string, points: number) => {
    setFormData(prev => ({
      ...prev,
      [currentStepData.field]: value
    }))

    // Auto-advance to next step after selection
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleComplete(value, points)
      }
    }, 300)
  }

  const handleComplete = (lastValue: string, lastPoints: number) => {
    // Calculate risk score based on all selections
    const allSelections = { ...formData, [currentStepData.field]: lastValue }
    let totalPoints = 0

    steps.forEach((step, index) => {
      const userChoice = allSelections[step.field]
      const option = step.options.find(opt => opt.value === userChoice)
      if (option) {
        totalPoints += option.points
      }
      if (index === currentStep) {
        totalPoints += lastPoints
      }
    })

    // Normalize to 0-100 scale
    const maxPoints = steps.reduce((sum, step) => sum + Math.max(...step.options.map(opt => opt.points)), 0)
    const riskScore = Math.round((totalPoints / maxPoints) * 100)

    onComplete({
      ...allSelections,
      riskScore
    })
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.CONSERVATIVE.max) return 'Conservative'
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.BALANCED.max) return 'Balanced'
    return 'Aggressive'
  }

  const getProgressPercentage = () => {
    return ((currentStep + 1) / steps.length) * 100
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(getProgressPercentage())}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <div className="text-sm font-medium text-blue-600 mb-2">
            {currentStepData.title}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentStepData.question}
          </h2>
        </div>

        <div className="space-y-3">
          {currentStepData.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value, option.points)}
              className={`w-full p-4 text-left border rounded-lg transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData[currentStepData.field] === option.value
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{option.label}</span>
                {formData[currentStepData.field] === option.value && (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-500 self-center">
            {formData[currentStepData.field] ? 'Auto-advancing...' : 'Select an option to continue'}
          </div>
        </div>
      </div>

      {/* Risk Level Preview */}
      {currentStep > 3 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              Based on your answers, you'll likely have a {getRiskLevel(Math.round((currentStep + 1) * 16.67))} risk profile
            </span>
          </div>
        </div>
      )}
    </div>
  )
}