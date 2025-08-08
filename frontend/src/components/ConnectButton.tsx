'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { openConnectModal, openAccountModal } from '../config/appkit'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    openConnectModal()
  }

  const handleAccount = () => {
    openAccountModal()
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">Connected</span>
        </div>
        
        <button
          onClick={handleAccount}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Connect Wallet
    </button>
  )
}