'use client'

import { useState, useEffect } from 'react'

export type TransactionStep = {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
  description?: string
  hash?: string
}

interface TransactionStatusProps {
  steps: TransactionStep[]
  isOpen: boolean
  onClose: () => void
  title: string
}

export function TransactionStatus({ steps, isOpen, onClose, title }: TransactionStatusProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  useEffect(() => {
    const activeIndex = steps.findIndex(step => step.status === 'active')
    if (activeIndex !== -1) {
      setCurrentStepIndex(activeIndex)
    }
  }, [steps])

  const getStepIcon = (status: TransactionStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'active':
        return (
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        )
      case 'error':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
          </div>
        )
    }
  }

  const getStepColor = (status: TransactionStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'active':
        return 'text-blue-600 font-semibold'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={steps.some(step => step.status === 'active')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              {getStepIcon(step.status)}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${getStepColor(step.status)}`}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </div>
                )}
                {step.hash && (
                  <div className="mt-1">
                    <a
                      href={`https://snowtrace.io/tx/${step.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View on Snowtrace
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {steps.every(step => step.status === 'completed') && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">Transaction completed successfully!</span>
            </div>
          </div>
        )}

        {steps.some(step => step.status === 'error') && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">Transaction failed. Please try again.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}