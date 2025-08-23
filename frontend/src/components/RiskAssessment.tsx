"use client";

import { useState, useEffect } from "react";
import { CONTRACT_CONSTANTS } from "../config/contracts";
import { useRiskAssessment } from "@/hooks/useAI";
import { RiskAssessmentAnswers } from "@/types/ai";

interface RiskAssessmentData {
  age: string;
  income: string;
  expenses: string;
  goal: string;
  riskTolerance: string;
  experience: string;
  timeHorizon: string;
  liquidityNeed: string;
}

interface RiskAssessmentProps {
  onComplete: (
    data: RiskAssessmentData & { riskScore: number; riskProfile: string }
  ) => void;
  className?: string;
}

export function RiskAssessment({
  onComplete,
  className = "",
}: RiskAssessmentProps) {
  const {
    calculateRiskScore,
    isLoading: isCalculating,
    error: apiError,
  } = useRiskAssessment();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RiskAssessmentData>({
    age: "",
    income: "",
    expenses: "",
    goal: "",
    riskTolerance: "",
    experience: "",
    timeHorizon: "",
    liquidityNeed: "",
  });

  const steps = [
    {
      title: "Personal Information",
      question: "What's your age?",
      field: "age" as keyof RiskAssessmentData,
      type: "number",
      options: [
        { value: "18-25", label: "18-25 years old", points: 25 },
        { value: "26-35", label: "26-35 years old", points: 20 },
        { value: "36-50", label: "36-50 years old", points: 15 },
        { value: "50+", label: "Over 50 years old", points: 10 },
      ],
    },
    {
      title: "Income & Expenses",
      question: "What's your annual income?",
      field: "income" as keyof RiskAssessmentData,
      type: "number",
      options: [
        { value: "under-40k", label: "Under $40,000", points: 5 },
        { value: "40k-80k", label: "$40,000 - $80,000", points: 15 },
        { value: "80k-150k", label: "$80,000 - $150,000", points: 20 },
        { value: "over-150k", label: "Over $150,000", points: 25 },
      ],
    },
    {
      title: "Monthly Expenses",
      question: "What are your average monthly expenses?",
      field: "expenses" as keyof RiskAssessmentData,
      type: "number",
      options: [
        { value: "under-2k", label: "Under $2,000", points: 25 },
        { value: "2k-4k", label: "$2,000 - $4,000", points: 20 },
        { value: "4k-6k", label: "$4,000 - $6,000", points: 10 },
        { value: "over-6k", label: "Over $6,000", points: 5 },
      ],
    },
    {
      title: "Financial Goals",
      question: "What's your primary investment goal?",
      field: "goal" as keyof RiskAssessmentData,
      options: [
        {
          value: "short_term",
          label: "Short-term savings (< 2 years)",
          points: 5,
        },
        {
          value: "medium_term",
          label: "Medium-term goals (2-5 years)",
          points: 15,
        },
        {
          value: "long_term",
          label: "Long-term growth (5-10 years)",
          points: 20,
        },
        {
          value: "retirement",
          label: "Retirement planning (10+ years)",
          points: 25,
        },
      ],
    },
    {
      title: "Risk Tolerance",
      question: "How do you feel about investment risk?",
      field: "riskTolerance" as keyof RiskAssessmentData,
      options: [
        {
          value: "very_low",
          label: "Very Conservative - Safety is my top priority",
          points: 5,
        },
        {
          value: "low",
          label: "Conservative - I prefer stable, lower returns",
          points: 10,
        },
        {
          value: "medium",
          label: "Balanced - I want moderate risk and returns",
          points: 15,
        },
        {
          value: "high",
          label: "Growth-oriented - Higher risk for better returns",
          points: 20,
        },
        {
          value: "very_high",
          label: "Aggressive - Maximum growth potential",
          points: 25,
        },
      ],
    },
    {
      title: "DeFi Experience",
      question: "How experienced are you with DeFi and crypto investing?",
      field: "experience" as keyof RiskAssessmentData,
      options: [
        { value: "none", label: "Complete beginner", points: 5 },
        { value: "beginner", label: "Basic understanding", points: 10 },
        { value: "intermediate", label: "Comfortable with DeFi", points: 15 },
        { value: "advanced", label: "Very experienced", points: 20 },
        { value: "expert", label: "DeFi expert", points: 25 },
      ],
    },
    {
      title: "Time Horizon",
      question: "How long can you keep your funds invested?",
      field: "timeHorizon" as keyof RiskAssessmentData,
      options: [
        { value: "1", label: "Less than 1 year", points: 5 },
        { value: "3", label: "1-3 years", points: 10 },
        { value: "5", label: "3-5 years", points: 15 },
        { value: "10", label: "5-10 years", points: 20 },
        { value: "20", label: "More than 10 years", points: 25 },
      ],
    },
    {
      title: "Liquidity Needs",
      question: "How quickly might you need access to your funds?",
      field: "liquidityNeed" as keyof RiskAssessmentData,
      options: [
        { value: "high", label: "May need funds anytime", points: 5 },
        {
          value: "medium",
          label: "Might need some funds occasionally",
          points: 15,
        },
        {
          value: "low",
          label: "Won't need these funds for a long time",
          points: 25,
        },
      ],
    },
  ];

  const currentStepData = steps[currentStep];

  const handleOptionSelect = (value: string, points: number) => {
    setFormData((prev) => ({
      ...prev,
      [currentStepData.field]: value,
    }));

    // Auto-advance to next step after selection
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete(value, points);
      }
    }, 300);
  };

  const handleComplete = async (lastValue: string, lastPoints: number) => {
    const allSelections = { ...formData, [currentStepData.field]: lastValue };

    // Convert form data to API format
    const apiAnswers: RiskAssessmentAnswers = {
      age:
        allSelections.age === "18-25"
          ? 22
          : allSelections.age === "26-35"
          ? 30
          : allSelections.age === "36-50"
          ? 43
          : 55,
      income:
        allSelections.income === "under-40k"
          ? 35000
          : allSelections.income === "40k-80k"
          ? 60000
          : allSelections.income === "80k-150k"
          ? 115000
          : 200000,
      monthlyExpenses:
        allSelections.expenses === "under-2k"
          ? 1500
          : allSelections.expenses === "2k-4k"
          ? 3000
          : allSelections.expenses === "4k-6k"
          ? 5000
          : 7500,
      investmentGoal: allSelections.goal as any,
      riskTolerance: allSelections.riskTolerance as any,
      investmentExperience: allSelections.experience as any,
      timeHorizon: parseInt(allSelections.timeHorizon) || 5,
      liquidityNeed: allSelections.liquidityNeed as any,
    };

    setIsSubmitting(true);
    try {
      // Call backend AI to calculate risk score
      const result = await calculateRiskScore(apiAnswers);

      onComplete({
        ...allSelections,
        riskScore: result.riskScore,
        riskProfile: result.riskProfile,
      });
      setIsSubmitting(false);
    } catch (error) {
      // Fallback to local calculation if API fails
      console.error("API calculation failed, using local calculation:", error);

      let totalPoints = 0;
      steps.forEach((step, index) => {
        const userChoice = allSelections[step.field];
        const option = step.options.find((opt) => opt.value === userChoice);
        if (option) {
          totalPoints += option.points;
        }
      });

      const maxPoints = steps.reduce(
        (sum, step) => sum + Math.max(...step.options.map((opt) => opt.points)),
        0
      );
      const riskScore = Math.round((totalPoints / maxPoints) * 100);
      const riskProfile =
        riskScore <= 33
          ? "Conservative"
          : riskScore <= 66
          ? "Balanced"
          : "Aggressive";

      onComplete({
        ...allSelections,
        riskScore,
        riskProfile,
      });
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.CONSERVATIVE.max)
      return "Conservative";
    if (score <= CONTRACT_CONSTANTS.RISK_RANGES.BALANCED.max) return "Balanced";
    return "Aggressive";
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
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
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500"
                  : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">
                  {option.label}
                </span>
                {formData[currentStepData.field] === option.value && (
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
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
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          <div className="text-sm text-gray-500 self-center">
            {formData[currentStepData.field]
              ? "Auto-advancing..."
              : "Select an option to continue"}
          </div>
        </div>
      </div>

      {/* Risk Level Preview */}
      {currentStep > 3 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              Based on your answers, you'll likely have a{" "}
              {getRiskLevel(Math.round((currentStep + 1) * 11.11))} risk profile
            </span>
          </div>
        </div>
      )}

      {/* Loading/Error State */}
      {(isSubmitting || isCalculating) && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-blue-900">
              Calculating your personalized risk profile...
            </span>
          </div>
        </div>
      )}

      {apiError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-red-900">
              {apiError} - Using offline calculation
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
