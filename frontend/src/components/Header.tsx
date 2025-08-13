'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from './ConnectButton';
import { BarChart3, BookOpen, Settings, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, requiresAuth: true },
    { href: '/analytics', label: 'Analytics', icon: TrendingUp, requiresAuth: true },
    { href: '/education', label: 'Learn', icon: BookOpen, requiresAuth: false },
    { href: '/risk-profile', label: 'Risk Profile', icon: Settings, requiresAuth: true },
  ].filter(item => !item.requiresAuth || isConnected);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-md border-b border-gray-700">
      <div className="container mx-auto px-4">
        {/* Main Navigation */}
        <div className="flex items-center justify-between h-16">
          {/* Logo and Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative w-32 h-10 transition-transform group-hover:scale-105">
                <Image 
                  src="/aura-logo.svg" 
                  alt="AURA" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side - Wallet Connect */}
          <div className="flex items-center space-x-4">
            <ConnectButton />
            
            {/* Settings Button */}
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
        <BarChart3 className="w-6 h-6" />
      </button>
    </header>
  );
}