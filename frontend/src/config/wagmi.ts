import { createConfig, http } from 'wagmi'
import { avalanche, avalancheFuji } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// Get environment variables with fallbacks
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''
const avalancheRpc = process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc'
const fujiRpc = process.env.NEXT_PUBLIC_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc'

if (!projectId) {
  console.warn('NEXT_PUBLIC_WC_PROJECT_ID is not set. Wallet Connect may not work properly.')
}

export const config = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [
    // Injected wallet (MetaMask, etc.)
    injected({
      shimDisconnect: true,
    }),
    
    // Coinbase Wallet
    coinbaseWallet({ 
      appName: 'Personal DeFi Wealth Manager',
      appLogoUrl: '/logo.png',
    }),
    
    // WalletConnect
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Personal DeFi Wealth Manager',
        description: 'AI-powered DeFi yield optimization on Avalanche',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['/logo.png'],
      },
      showQrModal: true,
    }),
  ],
  
  transports: {
    [avalanche.id]: http(avalancheRpc),
    [avalancheFuji.id]: http(fujiRpc),
  },
  
  // Enable batch calls for better performance
  batch: {
    multicall: true,
  },
  
  // Cache configuration
  cacheTime: 2_000,
  
  // Polling interval for watching changes
  pollingInterval: 4_000,
})

// Export chain information for easy access
export const supportedChains = {
  avalanche: {
    ...avalanche,
    rpcUrl: avalancheRpc,
  },
  avalancheFuji: {
    ...avalancheFuji,
    rpcUrl: fujiRpc,
  }
}

// Chain IDs for easy reference
export const CHAIN_IDS = {
  AVALANCHE: avalanche.id,      // 43114
  AVALANCHE_FUJI: avalancheFuji.id, // 43113
} as const

// Helper function to get chain by ID
export function getChainById(chainId: number) {
  switch (chainId) {
    case CHAIN_IDS.AVALANCHE:
      return supportedChains.avalanche
    case CHAIN_IDS.AVALANCHE_FUJI:
      return supportedChains.avalancheFuji
    default:
      return null
  }
}

// Helper function to check if chain is supported
export function isSupportedChain(chainId: number): boolean {
  return Object.values(CHAIN_IDS).includes(chainId as any)
}

// Default chain (Fuji for development, Avalanche for production)
export const defaultChain = process.env.NODE_ENV === 'production' 
  ? supportedChains.avalanche 
  : supportedChains.avalancheFuji