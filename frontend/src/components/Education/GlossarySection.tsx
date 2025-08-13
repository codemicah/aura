'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Tag } from 'lucide-react';
import { glossaryTerms, GlossaryTerm } from '../../data/educationalContent';

const GlossarySection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const filteredTerms = glossaryTerms.filter(term =>
    term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    term.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTerms = filteredTerms.sort((a, b) => 
    a.term.localeCompare(b.term)
  );

  // Group terms by first letter
  const groupedTerms = sortedTerms.reduce((acc, term) => {
    const firstLetter = term.term[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <BookOpen className="w-8 h-8 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">DeFi Glossary</h2>
          <p className="text-gray-400">Learn key terms and concepts in decentralized finance</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search terms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terms List */}
        <div className="space-y-4">
          {Object.entries(groupedTerms).map(([letter, terms]) => (
            <div key={letter}>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">{letter}</h3>
              <div className="space-y-2">
                {terms.map((term) => (
                  <button
                    key={term.term}
                    onClick={() => setSelectedTerm(term)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTerm?.term === term.term
                        ? 'bg-blue-600/20 border border-blue-500'
                        : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-white">{term.term}</div>
                    <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {term.definition}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Term Detail */}
        <div className="lg:sticky lg:top-4 h-fit">
          {selectedTerm ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-3">{selectedTerm.term}</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Definition</h4>
                  <p className="text-gray-300">{selectedTerm.definition}</p>
                </div>

                {selectedTerm.example && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Example</h4>
                    <p className="text-gray-300 italic">{selectedTerm.example}</p>
                  </div>
                )}

                {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Related Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.relatedTerms.map((relatedTerm) => {
                        const related = glossaryTerms.find(t => t.term === relatedTerm);
                        return related ? (
                          <button
                            key={relatedTerm}
                            onClick={() => setSelectedTerm(related)}
                            className="px-3 py-1 bg-gray-700 text-blue-400 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1"
                          >
                            <Tag className="w-3 h-3" />
                            <span className="text-sm">{relatedTerm}</span>
                          </button>
                        ) : (
                          <span
                            key={relatedTerm}
                            className="px-3 py-1 bg-gray-700 text-gray-400 rounded-lg text-sm"
                          >
                            {relatedTerm}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Select a term to view details</p>
            </div>
          )}
        </div>
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No terms found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default GlossarySection;