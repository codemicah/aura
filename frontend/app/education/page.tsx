"use client";

import { useState } from "react";
import Header from "../../src/components/Header";
import FAQSection from "../../src/components/Education/FAQSection";
import GlossarySection from "../../src/components/Education/GlossarySection";
import TutorialSection from "../../src/components/Education/TutorialSection";
import { BookOpen, HelpCircle, GraduationCap, FileText } from "lucide-react";

export default function EducationPage() {
  const [activeTab, setActiveTab] = useState<"tutorials" | "faq" | "glossary">(
    "tutorials"
  );

  const tabs = [
    { id: "tutorials", label: "Tutorials", icon: GraduationCap },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "glossary", label: "Glossary", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Education Center
              </h1>
              <p className="text-gray-400">
                Learn everything about DeFi wealth management
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Tutorials</p>
                <p className="text-2xl font-bold text-white">3</p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">FAQ Questions</p>
                <p className="text-2xl font-bold text-white">15</p>
              </div>
              <HelpCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Glossary Terms</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8 border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          {activeTab === "tutorials" && <TutorialSection />}
          {activeTab === "faq" && <FAQSection />}
          {activeTab === "glossary" && <GlossarySection />}
        </div>

        {/* Protocol Guides */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Protocol Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Aave Guide */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Aave</h3>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  Low Risk
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Decentralized lending protocol offering stable yields through
                supply and borrow markets.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300">No lock-up periods</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300">Predictable returns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300">Low smart contract risk</span>
                </li>
              </ul>
            </div>

            {/* TraderJoe Guide */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">TraderJoe</h3>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                  Medium Risk
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Leading DEX on Avalanche with liquidity provision opportunities
                and trading fees.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300">Earn trading fees</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">⚠</span>
                  <span className="text-gray-300">Impermanent loss risk</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300">JOE token rewards</span>
                </li>
              </ul>
            </div>

            {/* YieldYak Guide */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">YieldYak</h3>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                  High Risk
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Auto-compounding yield optimizer maximizing returns through
                complex strategies.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300">Auto-compounding</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300">Highest yields</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">⚠</span>
                  <span className="text-gray-300">Complex strategies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
