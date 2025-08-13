'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { openConnectModal } from '../config/appkit';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

export default function ProtectedRoute({ 
  children, 
  fallbackUrl = '/' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // Show connect wallet message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Wallet Connection Required</h2>
          <p className="text-gray-400 mb-8">
            Connect your wallet to access this page and start managing your DeFi portfolio.
          </p>
          
          <button
            onClick={openConnectModal}
            className="aura-button text-white px-8 py-3 rounded-lg transition-all font-medium flex items-center gap-2 mx-auto mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Wallet
          </button>
          
          <button
            onClick={() => router.push(fallbackUrl)}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}