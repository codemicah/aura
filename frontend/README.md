# AURA Frontend - Web Interface

Modern web interface for AURA's autonomous DeFi wealth management AI agent.

## 🏗️ Architecture

```
app/                    # Next.js app directory
├── page.tsx                 # Landing page
├── dashboard/              # Portfolio dashboard
├── onboarding/            # Risk assessment flow
├── analytics/             # Performance analytics
├── education/             # Educational content
└── layout.tsx             # Root layout

src/
├── components/          # React components
│   ├── AnalyticsDashboard.tsx   # Analytics visualization
│   ├── ConnectButton.tsx        # Wallet connection
│   ├── Header.tsx               # Navigation header
│   ├── InvestmentFlow.tsx      # Investment workflow
│   ├── PerformanceChart.tsx    # Charts and graphs
│   ├── PortfolioOverview.tsx   # Portfolio summary
│   ├── RiskAssessment.tsx      # Risk questionnaire
│   └── Web3Provider.tsx        # Web3 context
├── hooks/              # Custom React hooks
│   ├── useAI.ts                # AI agent integration
│   ├── useMarketData.ts        # Market data fetching
│   ├── usePortfolio.ts         # Portfolio management
│   └── useYieldOptimizer.ts    # Smart contract hooks
├── config/             # Configuration
│   ├── wagmi.ts               # Wagmi config
│   ├── contracts.ts           # Contract addresses
│   └── appkit.ts              # AppKit wallet setup
├── utils/              # Utilities
│   └── api.ts                 # API client
└── types/              # TypeScript types

```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or Web3 wallet

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## ⚙️ Environment Configuration

```env
# AppKit (Reown) - Required for wallet connection
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id_from_reown

# Blockchain
NEXT_PUBLIC_AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS=0x... # Deploy contract first

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=AURA
```

## 🎨 Key Features

### Landing Page

- Modern web3 design with animations
- Live protocol yields display
- Demo personas showcase
- Interactive feature cards

### Risk Assessment

- Multi-step questionnaire
- Dynamic risk score calculation
- Personalized strategy generation
- Real-time validation

### Dashboard

- Portfolio overview with current value
- Allocation breakdown by protocol
- Performance metrics and charts
- One-click rebalancing

### Investment Flow

- Guided deposit process
- AI-powered allocation recommendations
- Transaction status tracking
- Gas estimation

### Analytics

- Historical performance charts
- Risk metrics (Sharpe ratio, drawdown)
- Benchmark comparisons
- Protocol-specific analytics

### Education

- Interactive tutorials
- DeFi glossary
- Protocol guides
- FAQ section

## 🔗 Web3 Integration

### Wagmi Configuration

```typescript
// Supported chains
- Avalanche C-Chain (43114)
- Avalanche Fuji (43113)

// Wallet connectors
- MetaMask
- WalletConnect
- Coinbase Wallet
- Injected wallets
```

### Smart Contract Hooks

- `useYieldOptimizer` - Main contract interaction
- `usePortfolio` - Portfolio data fetching
- `useRebalance` - Rebalancing operations
- `useWithdraw` - Withdrawal management

## 🎯 Custom Hooks

### useAI

```typescript
// AI agent integration
const { riskScore, allocation, recommendations } = useAI();
```

### useMarketData

```typescript
// Real-time market data
const { yields, avaxPrice, protocolData } = useMarketData();
```

### usePortfolio

```typescript
// Portfolio management
const { portfolio, performance, history } = usePortfolio(address);
```

## 🎨 UI Components

### Core Components

- **ConnectButton** - Wallet connection with network switching
- **RiskAssessment** - Interactive risk questionnaire
- **PortfolioOverview** - Real-time portfolio display
- **InvestmentFlow** - Step-by-step investment process
- **PerformanceChart** - Interactive performance visualization

### Layout Components

- **Header** - Navigation and wallet status
- **MobileNav** - Responsive mobile navigation
- **SkeletonLoaders** - Loading states
- **ErrorBoundary** - Error handling

## 📊 State Management

- **React Context** - Global app state
- **TanStack Query** - Server state and caching
- **wagmi** - Web3 state management
- **localStorage** - User preferences persistence

## 🎨 Styling

- **Tailwind CSS v4** - Utility-first styling
- **CSS Modules** - Component-specific styles
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - Native dark theme

## 📝 Scripts

```bash
npm run dev         # Development server
npm run build       # Production build
npm run start       # Production server
npm run lint        # ESLint checking
npm run type-check  # TypeScript validation
```

## 🧪 Demo Mode

Three demo personas available for testing:

| Persona  | Risk Level   | Allocation                            |
| -------- | ------------ | ------------------------------------- |
| Sarah    | Conservative | 70% Aave, 30% TraderJoe               |
| Mike     | Balanced     | 40% Aave, 40% TraderJoe, 20% YieldYak |
| Jennifer | Aggressive   | 20% Aave, 30% TraderJoe, 50% YieldYak |

## 🚨 Troubleshooting

**Wallet connection issues**

- Ensure NEXT_PUBLIC_WC_PROJECT_ID is set
- Check wallet is on Avalanche network
- Clear browser cache and retry

**Contract interaction errors**

- Verify contract is deployed
- Check NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS
- Ensure sufficient AVAX for gas

**API connection failed**

- Verify backend is running on port 3001
- Check NEXT_PUBLIC_API_URL setting
- Confirm CORS is configured

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with Web3 support

## 🔧 Performance

- **Next.js 15** - App router with RSC
- **React 19** - Latest React features
- **Code splitting** - Automatic route-based splitting
- **Image optimization** - Next/Image component
- **Font optimization** - Next/Font with Geist

## 📋 Requirements

- **Node.js**: 18+
- **Browser**: Web3-enabled
- **Wallet**: MetaMask or compatible
- **Backend**: AURA backend API running

---

_AURA Frontend - Autonomous DeFi Management Interface_
