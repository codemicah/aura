'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  address: string | undefined;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status only - no redirects
    const authenticated = isConnected && !!address;
    setIsAuthenticated(authenticated);
    setIsLoading(isConnecting);
  }, [isConnected, address, isConnecting]);

  const checkAuth = () => {
    return isConnected && !!address;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, address, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}