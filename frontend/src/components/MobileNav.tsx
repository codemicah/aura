'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  BarChart3,
  BookOpen,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  Shield,
  DollarSign,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const mainNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, badge: 'Live' },
    { href: '/onboarding', label: 'Risk Profile', icon: Shield },
  ];

  const portfolioNavItems: NavItem[] = [
    { href: '/dashboard#portfolio', label: 'Portfolio Overview', icon: Wallet },
    { href: '/dashboard#performance', label: 'Performance', icon: TrendingUp },
    { href: '/dashboard#invest', label: 'Invest', icon: DollarSign },
  ];

  const supportNavItems: NavItem[] = [
    { href: '/help', label: 'Help Center', icon: HelpCircle },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const NavSection = ({ title, items }: { title?: string; items: NavItem[] }) => (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-4 py-3 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-500'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                  {item.badge}
                </span>
              )}
              {!item.badge && <ChevronRight className="w-4 h-4 text-gray-500" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div>
              <h2 className="text-white font-bold">DeFi Manager</h2>
              <p className="text-xs text-gray-400">Smart Yield Optimizer</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] py-6">
          <NavSection items={mainNavItems} />
          <NavSection title="Portfolio" items={portfolioNavItems} />
          <NavSection title="Support" items={supportNavItems} />

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">U</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">0x1234...5678</p>
                  <p className="text-xs text-gray-400">Connected</p>
                </div>
              </div>
            </div>
            <button className="w-full flex items-center justify-center space-x-2 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Disconnect</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}