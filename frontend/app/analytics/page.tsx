'use client';

import ProtectedRoute from '../../src/components/ProtectedRoute';
import AnalyticsDashboard from '../../src/components/AnalyticsDashboard';
import Header from '../../src/components/Header';
import { useAccount } from 'wagmi';
import { useRiskProfile } from '../../src/hooks/useRiskProfile';

function AnalyticsContent() {
  const { address, isConnected } = useAccount();
  const { hasProfile, isLoading: profileLoading } = useRiskProfile();

  // Let middleware handle the redirection instead of doing it here
  // This prevents double redirects and flashing

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Analytics</h1>
          <p className="text-gray-400">
            Comprehensive performance metrics and risk analysis for your DeFi portfolio
          </p>
        </div>

        {isConnected ? (
          <AnalyticsDashboard userId={address} />
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">Please connect your wallet to view analytics</p>
            <a
              href="/onboarding"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}