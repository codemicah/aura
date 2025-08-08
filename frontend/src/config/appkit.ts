import { createAppKit } from '@reown/appkit/react'
import { avalanche, avalancheFuji } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage } from 'wagmi'

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''

if (!projectId) {
  console.warn('NEXT_PUBLIC_WC_PROJECT_ID is not set. Using placeholder for development.')
}

// Create wagmi adapter for AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: [avalanche, avalancheFuji],
  projectId,
  ssr: true, // Enable server-side rendering support
  storage: createStorage({
    storage: cookieStorage,
  }),
})

// App metadata
const metadata = {
  name: 'Personal DeFi Wealth Manager',
  description: 'AI-powered financial advisor that optimizes yields across Avalanche DeFi protocols',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://personal-defi-manager.vercel.app',
  icons: ['/logo.png'],
}

// Create AppKit instance
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [avalanche, avalancheFuji],
  projectId,
  metadata,
  
  // UI customization
  features: {
    analytics: true, // Enable analytics
    email: false,    // Disable email login
    socials: [],     // No social logins
    emailShowWallets: true,
  },
  
  // Theme configuration
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#2563eb', // Blue accent color
    '--w3m-border-radius-master': '12px',
  },
  
  // Custom configuration
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
  ],
  
  // Default network
  defaultNetwork: process.env.NODE_ENV === 'production' ? avalanche : avalancheFuji,
})

// Export wagmi config from the adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Export useful AppKit utilities
export const AppKit = {
  open: () => modal.open(),
  close: () => modal.close(),
  subscribeState: modal.subscribeState,
  subscribeTheme: modal.subscribeTheme,
  setThemeMode: modal.setThemeMode,
}

// Helper functions for AppKit integration
export const openConnectModal = () => modal.open()
export const openAccountModal = () => modal.open({ view: 'Account' })
export const openNetworkModal = () => modal.open({ view: 'Networks' })

// Theme utilities
export const setLightTheme = () => modal.setThemeMode('light')
export const setDarkTheme = () => modal.setThemeMode('dark')
export const toggleTheme = () => {
  const currentTheme = modal.getThemeMode()
  modal.setThemeMode(currentTheme === 'light' ? 'dark' : 'light')
}