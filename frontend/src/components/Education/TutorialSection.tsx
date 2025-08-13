'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, Clock, ChevronRight, ChevronLeft, 
  AlertCircle, Lightbulb, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { tutorials, Tutorial } from '../../data/educationalContent';

const TutorialSection: React.FC = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStepComplete = () => {
    if (selectedTutorial) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
      
      if (currentStep < selectedTutorial.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const resetTutorial = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <GraduationCap className="w-8 h-8 text-green-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Interactive Tutorials</h2>
          <p className="text-gray-400">Step-by-step guides to master DeFi wealth management</p>
        </div>
      </div>

      {!selectedTutorial ? (
        /* Tutorial List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutorials.map((tutorial) => (
            <button
              key={tutorial.id}
              onClick={() => {
                setSelectedTutorial(tutorial);
                resetTutorial();
              }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white">{tutorial.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
                  {tutorial.difficulty}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">{tutorial.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{tutorial.duration}</span>
                </div>
                <div className="flex items-center space-x-1 text-blue-400">
                  <span className="text-sm">{tutorial.steps.length} steps</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Tutorial Content */
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          {/* Tutorial Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedTutorial(null)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to tutorials</span>
              </button>
              
              <span className={`px-3 py-1 rounded ${getDifficultyColor(selectedTutorial.difficulty)}`}>
                {selectedTutorial.difficulty}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">{selectedTutorial.title}</h2>
            <p className="text-gray-400">{selectedTutorial.description}</p>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Step {currentStep + 1} of {selectedTutorial.steps.length}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(((completedSteps.size) / selectedTutorial.steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((completedSteps.size) / selectedTutorial.steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {selectedTutorial.steps[currentStep].title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed mb-4">
                {selectedTutorial.steps[currentStep].content}
              </p>

              {selectedTutorial.steps[currentStep].tip && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-blue-400 font-medium mb-1">Pro Tip</h4>
                      <p className="text-gray-300 text-sm">
                        {selectedTutorial.steps[currentStep].tip}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedTutorial.steps[currentStep].warning && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-400 font-medium mb-1">Warning</h4>
                      <p className="text-gray-300 text-sm">
                        {selectedTutorial.steps[currentStep].warning}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              <div className="flex space-x-2">
                {selectedTutorial.steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-blue-500 w-8'
                        : completedSteps.has(index)
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {currentStep < selectedTutorial.steps.length - 1 ? (
                <button
                  onClick={handleStepComplete}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleStepComplete();
                    setSelectedTutorial(null);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Complete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialSection;