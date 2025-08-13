'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { faqData, FAQItem } from '../../data/educationalContent';

const FAQSection: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Questions' },
    { value: 'general', label: 'General' },
    { value: 'defi', label: 'DeFi Basics' },
    { value: 'risk', label: 'Risk Management' },
    { value: 'technical', label: 'Technical' },
    { value: 'security', label: 'Security' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-blue-500/20 text-blue-400';
      case 'defi': return 'bg-green-500/20 text-green-400';
      case 'risk': return 'bg-yellow-500/20 text-yellow-400';
      case 'technical': return 'bg-purple-500/20 text-purple-400';
      case 'security': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <HelpCircle className="w-8 h-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-gray-400">Find answers to common questions about DeFi wealth management</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {filteredFAQs.map((faq, index) => {
          const isExpanded = expandedItems.has(index);
          
          return (
            <div
              key={index}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleExpanded(index)}
                className="w-full px-6 py-4 flex items-start justify-between hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start space-x-3 text-left">
                  <div className="mt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{faq.question}</h3>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${getCategoryColor(faq.category)}`}>
                      {faq.category}
                    </span>
                  </div>
                </div>
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-4 border-t border-gray-700">
                  <p className="text-gray-300 mt-4 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No questions found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default FAQSection;