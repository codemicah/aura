'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Zap, Shield, TrendingUp, Sparkles, ChevronRight, Activity, Layers, DollarSign, Rocket, Brain, LineChart, Lock, Coins, Network, Hexagon, Code, Globe, Cpu, BarChart3, Wallet } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [benqiAPY, setBenqiAPY] = useState(0);
  const [traderJoeAPY, setTraderJoeAPY] = useState(0);
  const [yieldYakAPY, setYieldYakAPY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const fullText = "Autonomous DeFi Intelligence";

  useEffect(() => {
    setMounted(true);
    
    // Typing animation with glitch effect
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80);

    // Animate APY counters with random fluctuations
    const animateAPY = () => {
      const duration = 3000;
      const steps = 100;
      const interval = duration / steps;
      let currentStep = 0;
      
      const timer = setInterval(() => {
        if (currentStep < steps) {
          const progress = currentStep / steps;
          const easeOut = 1 - Math.pow(1 - progress, 3);
          setBenqiAPY((5.2 + Math.random() * 0.5) * easeOut);
          setTraderJoeAPY((8.7 + Math.random() * 0.3) * easeOut);
          setYieldYakAPY((12.4 + Math.random() * 0.6) * easeOut);
          currentStep++;
        } else {
          clearInterval(timer);
          // Continue with slight fluctuations
          setInterval(() => {
            setBenqiAPY(5.2 + Math.random() * 0.2);
            setTraderJoeAPY(8.7 + Math.random() * 0.3);
            setYieldYakAPY(12.4 + Math.random() * 0.4);
          }, 2000);
        }
      }, interval);
    };
    
    setTimeout(animateAPY, 800);

    // Mouse tracking for parallax
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Scroll tracking
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(typingInterval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/95 to-black" />
      </div>

      {/* Dynamic Neon Orbs with Parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: `${-200 + scrollY * 0.1}px`,
            right: `${-200 + mousePosition.x * 0.02}px`,
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(80px)',
            bottom: `${-300 + scrollY * 0.15}px`,
            left: `${-300 - mousePosition.x * 0.02}px`,
            transform: `translate(${-mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)`,
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
            filter: 'blur(70px)',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        />
        
        {/* Floating neon particles */}
        {mounted && [...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-slow"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: `radial-gradient(circle, ${['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]}, transparent)`,
              boxShadow: `0 0 ${10 + Math.random() * 20}px currentColor`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
            }}
          />
        ))}
      </div>

      {/* Cyber Grid Lines */}
      <div className="fixed inset-0 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {[...Array(20)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 50}
              x2="100%"
              y2={i * 50}
              stroke="url(#grid-gradient)"
              strokeWidth="0.5"
              opacity={0.3}
            />
          ))}
          {[...Array(30)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 50}
              y1="0"
              x2={i * 50}
              y2="100%"
              stroke="url(#grid-gradient)"
              strokeWidth="0.5"
              opacity={0.3}
            />
          ))}
        </svg>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Animated Badge with Neon Glow */}
          <div className="inline-flex items-center gap-3 px-6 py-3 mb-10 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />
            <div className="relative flex items-center gap-3 px-6 py-3 bg-black/50 backdrop-blur-xl border border-violet-500/30 rounded-full">
              <div className="relative w-8 h-8">
                <Image src="/aura-icon.svg" alt="AURA" fill className="object-contain" />
              </div>
              <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 uppercase tracking-wider">
                AURA AI Agent Active
              </span>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Main Heading with Glitch Effect */}
          <h1 className="text-6xl md:text-8xl font-black mb-8 relative">
            <span className="block text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-blue-400 to-pink-400 animate-gradient-x">
              {typedText}
            </span>
            <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-br from-pink-400 via-violet-400 to-blue-400 animate-glitch-1 opacity-50">
              {typedText}
            </span>
            <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-pink-400 to-violet-400 animate-glitch-2 opacity-50">
              {typedText}
            </span>
            <span className="animate-blink text-violet-400">_</span>
          </h1>

          {/* Subheading with Neon Text */}
          <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
            Your autonomous wealth manager leveraging
            <span className="relative inline-block mx-2">
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 blur-lg opacity-50" />
              <span className="relative text-white font-bold"> Machine Learning </span>
            </span>
            to optimize yields across
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-bold"> TraderJoe</span>,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold"> Benqi</span> &
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold"> YieldYak</span>
          </p>

          {/* CTA Buttons with Cyberpunk Style */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/onboarding"
              className="group relative px-10 py-5 overflow-hidden rounded-2xl font-bold text-lg transition-all duration-500 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-pink-600 opacity-100 group-hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-pink-600 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-3 text-white">
                <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Launch Your DeFi Journey
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-scan" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-scan delay-1000" />
              </div>
            </Link>
            
            <Link
              href="/dashboard"
              className="group relative px-10 py-5 overflow-hidden rounded-2xl font-bold text-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 border border-gray-700 group-hover:border-violet-500/50 rounded-2xl transition-colors duration-500" />
              <span className="relative z-10 flex items-center gap-3 text-gray-300 group-hover:text-white transition-colors">
                <Brain className="w-6 h-6 group-hover:animate-pulse" />
                AI Dashboard
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                $2.4B+
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">TVL Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                15K+
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                247%
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Avg Returns</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Feature Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-4">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Features</span>
          </h2>
          <p className="text-gray-400 text-xl">Cutting-edge technology meets DeFi innovation</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Neural Risk Engine */}
          <div className="group relative perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-purple-600/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
            <div className="relative bg-black/40 backdrop-blur-2xl border border-violet-500/20 group-hover:border-violet-400/50 rounded-3xl p-10 transition-all duration-500 transform-gpu group-hover:rotate-y-5 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Neural Risk Engine</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Advanced ML algorithms analyze market patterns and adjust strategies in real-time for optimal risk management.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-500">Active</span>
                  </div>
                  <div className="text-violet-400 font-semibold text-sm">99.9% Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Chain Bridge */}
          <div className="group relative perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
            <div className="relative bg-black/40 backdrop-blur-2xl border border-blue-500/20 group-hover:border-blue-400/50 rounded-3xl p-10 transition-all duration-500 transform-gpu group-hover:rotate-y-5 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  <Network className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Multi-Protocol Sync</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Seamlessly integrate and rebalance across multiple DeFi protocols with atomic transactions.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-500">Synced</span>
                  </div>
                  <div className="text-blue-400 font-semibold text-sm">3 Protocols</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quantum Yield Optimizer */}
          <div className="group relative perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 to-rose-600/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
            <div className="relative bg-black/40 backdrop-blur-2xl border border-pink-500/20 group-hover:border-pink-400/50 rounded-3xl p-10 transition-all duration-500 transform-gpu group-hover:rotate-y-5 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Quantum Optimizer</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Next-gen yield optimization using quantum-inspired algorithms for maximum returns.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-500">Computing</span>
                  </div>
                  <div className="text-pink-400 font-semibold text-sm">+47% APY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Protocol Dashboard */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-400 uppercase tracking-wider">Live Data</span>
          </div>
          <h2 className="text-5xl font-black text-white mb-4">
            Real-Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Protocol Yields</span>
          </h2>
          <p className="text-gray-400 text-xl">Connected to Avalanche mainnet</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Benqi Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-black/60 backdrop-blur-2xl border border-green-500/20 group-hover:border-green-400/50 rounded-3xl p-8 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Benqi Protocol</h3>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Lending & Borrowing</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400 blur-xl opacity-50 animate-pulse" />
                  <Activity className="w-8 h-8 text-green-400 relative z-10" />
                </div>
              </div>
              <div className="mb-6">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  {benqiAPY.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Current APY</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Risk Level</span>
                  <div className="flex gap-1">
                    <div className="w-8 h-2 bg-green-400 rounded-full" />
                    <div className="w-8 h-2 bg-gray-700 rounded-full" />
                    <div className="w-8 h-2 bg-gray-700 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">TVL</span>
                  <span className="text-sm font-semibold text-green-400">$847M</span>
                </div>
              </div>
            </div>
          </div>

          {/* TraderJoe Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-black/60 backdrop-blur-2xl border border-blue-500/20 group-hover:border-blue-400/50 rounded-3xl p-8 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan delay-500" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">TraderJoe DEX</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Liquidity Pools</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 blur-xl opacity-50 animate-pulse" />
                  <LineChart className="w-8 h-8 text-blue-400 relative z-10" />
                </div>
              </div>
              <div className="mb-6">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                  {traderJoeAPY.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Current APY</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Risk Level</span>
                  <div className="flex gap-1">
                    <div className="w-8 h-2 bg-blue-400 rounded-full" />
                    <div className="w-8 h-2 bg-blue-400 rounded-full" />
                    <div className="w-8 h-2 bg-gray-700 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">TVL</span>
                  <span className="text-sm font-semibold text-blue-400">$1.2B</span>
                </div>
              </div>
            </div>
          </div>

          {/* YieldYak Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-black/60 backdrop-blur-2xl border border-purple-500/20 group-hover:border-purple-400/50 rounded-3xl p-8 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan delay-1000" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">YieldYak Auto</h3>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Auto-Compound</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-400 blur-xl opacity-50 animate-pulse" />
                  <TrendingUp className="w-8 h-8 text-purple-400 relative z-10" />
                </div>
              </div>
              <div className="mb-6">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  {yieldYakAPY.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Current APY</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Risk Level</span>
                  <div className="flex gap-1">
                    <div className="w-8 h-2 bg-purple-400 rounded-full" />
                    <div className="w-8 h-2 bg-purple-400 rounded-full" />
                    <div className="w-8 h-2 bg-purple-400 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">TVL</span>
                  <span className="text-sm font-semibold text-purple-400">$523M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-pink-600/10 blur-3xl" />
          <div className="relative bg-black/40 backdrop-blur-2xl border border-gray-800 rounded-3xl p-16 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-scan" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-scan delay-2000" />
            
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full mb-8">
                <Globe className="w-4 h-4 text-violet-400 animate-spin-slow" />
                <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">Web3 Ready</span>
              </div>
              
              <h2 className="text-5xl font-black text-white mb-6">
                Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-pink-400">Future of DeFi</span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-10">
                Join the revolution. Let AI maximize your yields while you sleep.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  href="/onboarding"
                  className="group relative inline-flex items-center gap-3 px-10 py-5 overflow-hidden rounded-2xl font-bold text-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-pink-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-pink-600 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-3 text-white">
                    <Wallet className="w-6 h-6" />
                    Connect Wallet & Start
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </span>
                </Link>
                
                <button className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-gray-400 hover:text-white transition-colors">
                  <Code className="w-6 h-6" />
                  View Smart Contracts
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2 text-gray-500">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Audited</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm">Non-Custodial</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Hexagon className="w-5 h-5" />
                  <span className="text-sm">Open Source</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-gray-500">
                Built for UK AI Agent Hackathon Ep2 • Powered by
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-bold ml-1">Avalanche</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <span>© 2025 DeFi Revolution</span>
              <span>•</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
          }
          33% { 
            transform: translateY(-30px) translateX(10px); 
          }
          66% { 
            transform: translateY(20px) translateX(-10px); 
          }
        }
        
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes glitch-1 {
          0%, 100% { 
            clip-path: inset(0 0 0 0); 
            transform: translate(0);
          }
          20% { 
            clip-path: inset(20% 0 30% 0); 
            transform: translate(-2px, 2px);
          }
          40% { 
            clip-path: inset(50% 0 20% 0); 
            transform: translate(2px, -2px);
          }
        }
        
        @keyframes glitch-2 {
          0%, 100% { 
            clip-path: inset(0 0 0 0); 
            transform: translate(0);
          }
          30% { 
            clip-path: inset(70% 0 10% 0); 
            transform: translate(2px, 1px);
          }
          60% { 
            clip-path: inset(10% 0 60% 0); 
            transform: translate(-2px, -1px);
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0; }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        
        .animate-scan {
          animation: scan 4s linear infinite;
        }
        
        .animate-glitch-1 {
          animation: glitch-1 3s infinite linear alternate-reverse;
        }
        
        .animate-glitch-2 {
          animation: glitch-2 3s infinite linear alternate-reverse;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-blink {
          animation: blink 1.5s infinite;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-gpu {
          transform-style: preserve-3d;
          will-change: transform;
        }
        
        .group:hover .group-hover\\:rotate-y-5 {
          transform: rotateY(5deg);
        }
        
        .delay-500 {
          animation-delay: 500ms;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}