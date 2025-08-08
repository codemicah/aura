'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ReactNode, useState } from 'react'
import { wagmiConfig } from '../config/appkit'
import { NotificationProvider } from './NotificationSystem'
import { ErrorBoundary } from './ErrorBoundary'

// Create a stable QueryClient instance
let queryClientSingleton: QueryClient | undefined = undefined

const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
          retry: 3,
          refetchOnWindowFocus: false,
        },
      },
    })
  } else {
    // Browser: make a new query client if we don't already have one
    return (queryClientSingleton ??= new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 10 * 60 * 1000, // 10 minutes
          retry: 3,
          refetchOnWindowFocus: true,
        },
      },
    }))
  }
}

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

// Optional: Add React Query devtools in development
export function Web3ProviderWithDevtools({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Add React Query Devtools in development */}
        {process.env.NODE_ENV === 'development' && (
          <div id="react-query-devtools">
            {/* React Query Devtools will be mounted here if installed */}
          </div>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}