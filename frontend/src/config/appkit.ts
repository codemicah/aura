import { createAppKit } from '@reown/appkit/react'
import { avalanche, avalancheFuji } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage } from 'wagmi'
import { defineChain } from 'viem'

// Get project ID and RPC URLs from environment
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''
const localRpc = process.env.NEXT_PUBLIC_LOCAL_RPC || 'http://127.0.0.1:8545'

if (!projectId) {
  console.warn('NEXT_PUBLIC_WC_PROJECT_ID is not set. Using placeholder for development.')
}

// Define local Avalanche network for AppKit
const avalancheLocal = defineChain({
  id: 31337,
  name: 'Avalanche Local',
  nativeCurrency: {
    decimals: 18,
    name: 'AVAX',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: [localRpc],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Local Explorer', 
      url: 'http://localhost:8545' 
    },
  },
  testnet: true,
})

// Get chain ID from environment
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337')

// Networks array - only include the configured network
const networks: any[] = chainId === 31337 
  ? [avalancheLocal] // Only local network when on localhost
  : chainId === 43113
  ? [avalancheFuji] // Only Fuji testnet
  : [avalanche] // Only mainnet

// Create wagmi adapter for AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: networks as any,
  projectId,
  ssr: true, // Enable server-side rendering support
  storage: createStorage({
    storage: cookieStorage,
  }),
})

// App metadata
const metadata = {
  name: 'AURA',
  description: 'Autonomous AI agent that revolutionizes DeFi wealth management',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://aura-defi.vercel.app',
  icons: ['/aura-icon.svg'],
}

// Create AppKit instance
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
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
  themeMode: 'dark', // Changed to dark for better visibility
  themeVariables: {
    '--w3m-accent': '#2563eb', // Blue accent color
    '--w3m-border-radius-master': '12px',
  },
  
  // Custom configuration
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
  ],
  
  // Default network - use the configured network
  defaultNetwork: chainId === 31337 
    ? avalancheLocal as any
    : chainId === 43113
    ? avalancheFuji
    : avalanche,
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