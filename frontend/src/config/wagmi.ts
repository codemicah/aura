import { createConfig, http } from 'wagmi'
import { avalanche, avalancheFuji } from 'wagmi/chains'
import { defineChain } from 'viem'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337')
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'

if (!projectId) {
  console.warn('NEXT_PUBLIC_WC_PROJECT_ID is not set. Wallet Connect may not work properly.')
}

// Define the chain based on chain ID from environment
function getChainConfig() {
  switch (chainId) {
    case 43114:
      // Avalanche Mainnet
      return {
        ...avalanche,
        rpcUrls: {
          ...avalanche.rpcUrls,
          default: { http: [rpcUrl] },
        },
      }
    case 43113:
      // Avalanche Fuji Testnet
      return {
        ...avalancheFuji,
        rpcUrls: {
          ...avalancheFuji.rpcUrls,
          default: { http: [rpcUrl] },
        },
      }
    case 31337:
    default:
      // Local Anvil - Note: MetaMask will show "ETH" instead of "AVAX" for local development (chain ID 31337)
      // This is expected behavior and doesn't affect functionality
      return defineChain({
        id: chainId,
        name: 'Avalanche Local',
        nativeCurrency: {
          decimals: 18,
          name: 'AVAX',
          symbol: 'AVAX',
        },
        rpcUrls: {
          default: {
            http: [rpcUrl],
          },
        },
        blockExplorers: {
          default: { 
            name: 'Local Explorer', 
            url: rpcUrl,
          },
        },
        testnet: true,
      })
  }
}

// Single chain configuration
export const currentChain = getChainConfig()
const chains = [currentChain] as const

export const config = createConfig({
  chains,
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
    
    // WalletConnect - only for non-local networks
    ...(projectId ? [
      walletConnect({ 
        projectId,
        metadata: {
          name: 'Personal DeFi Wealth Manager',
          description: 'AI-powered DeFi yield optimization on Avalanche',
          url: typeof window !== 'undefined' ? window.location.origin : '',
          icons: ['/logo.png'],
        },
        showQrModal: true,
      })
    ] : []),
  ],
  
  transports: {
    [currentChain.id]: http(rpcUrl),
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

// Export current chain information
export const supportedChain = currentChain

// Helper function to check if connected to correct chain
export function isCorrectChain(connectedChainId: number): boolean {
  return connectedChainId === chainId
}

// Default chain is the configured chain
export const defaultChain = currentChain