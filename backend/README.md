# AURA Backend - AI Agent Engine

The backend service powering AURA's autonomous AI agent for DeFi portfolio management.

## 🏗️ Architecture

```
src/
├── controllers/          # Request handlers
│   ├── aiController.ts         # AI agent decision endpoints
│   ├── analyticsController.ts  # Performance analytics
│   ├── marketController.ts      # Market data aggregation
│   └── portfolioController.ts   # Portfolio management
├── services/            # Core services
│   ├── ai.ts                   # AI decision engine
│   ├── analytics.ts            # Performance calculation
│   ├── autoRebalance.ts        # Autonomous rebalancing
│   ├── backtesting.ts          # Strategy backtesting
│   ├── blockchain.ts           # Smart contract interaction
│   ├── database.ts             # SQLite operations
│   ├── defi.ts                 # Protocol data aggregation
│   └── demoScenarios.ts        # Demo user generation
├── routes/              # API routes
├── middleware/          # Express middleware
├── types/              # TypeScript definitions
├── utils/              # Utilities and config
└── index.ts            # Application entry point
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite3

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database with demo data
npm run seed

# Start development server
npm run dev
```

## ⚙️ Environment Configuration

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./data/defi-manager.db

# Blockchain
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
YIELD_OPTIMIZER_ADDRESS=0x... # Deploy contract first

# Protocol Addresses (Fuji Testnet)
AAVE_V3_POOL=0x794a61358D6845594F94dc1DB02A252b5b4814aD
TRADERJOE_ROUTER=0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901
YIELDYAK_FARM=0x1DAff3C889Aff2f0b0C15E52E546c60CeCC2BBf6

# AI Configuration
ENABLE_AI_RECOMMENDATIONS=true
AI_CONFIDENCE_THRESHOLD=0.7
AI_LEARNING_RATE=0.15
```

## 📡 API Endpoints

### AI Agent (`/api/v1/ai`)

- `POST /assess-risk` - Calculate risk score from user profile
- `GET /allocation-strategy` - Get AI-determined portfolio allocation
- `POST /recommendations` - Get personalized investment advice
- `POST /calculate-surplus` - Calculate investable amount
- `GET /learning-metrics` - View AI learning progress

### Portfolio (`/api/v1/portfolio`)

- `GET /:address` - Get user portfolio
- `GET /:address/balance` - Get wallet balance
- `GET /:address/history` - Portfolio history
- `POST /:address/performance` - Performance metrics
- `GET /health` - Service health check

### Market Data (`/api/v1/market`)

- `GET /yields` - Current protocol APYs (Aave V3, TraderJoe, YieldYak)
- `GET /data` - Comprehensive market data
- `GET /avax-price` - AVAX/USD price
- `GET /protocol/:name` - Specific protocol data (aave, traderjoe, yieldyak)

### Analytics (`/api/v1/analytics`)

- `GET /performance/:address` - Portfolio performance
- `GET /risk-metrics/:address` - Risk analysis
- `GET /benchmark-comparison/:address` - Benchmark comparisons

### Backtesting (`/api/v1/backtesting`)

- `POST /run` - Run backtest simulation
- `GET /scenarios` - Get test scenarios

## 🤖 AI Agent Features

### Risk Assessment Engine

Analyzes multiple factors to generate risk scores (0-100):

- Age and life stage
- Income and expenses
- Investment goals
- Risk tolerance questionnaire

### Allocation Strategy

Dynamic portfolio allocation based on:

- **Conservative (0-33)**: 70% Aave V3, 30% TraderJoe
- **Balanced (34-66)**: 40% Aave V3, 40% TraderJoe, 20% YieldYak
- **Aggressive (67-100)**: 20% Aave V3, 30% TraderJoe, 50% YieldYak

### Protocol Integration

- **Aave V3**: Enterprise-grade lending protocol ($10B+ TVL)
- **TraderJoe**: DEX liquidity provision
- **YieldYak**: Auto-compounding yield farming

### Learning System

- Tracks user behavior patterns
- Adapts recommendations over time
- Improves accuracy with each interaction
- Stores learning data in SQLite

### Auto-Rebalancing

Autonomous rebalancing triggers:

- Time-based (configurable frequency)
- Drift threshold (>10% allocation drift)
- Market opportunity (>1% APY improvement)
- Risk profile changes

## 🗄️ Database Schema

```sql
-- Core tables
user_profiles         # User risk profiles and preferences
portfolio_snapshots   # Historical portfolio data (includes aave_amount)
transactions         # Transaction history
ai_recommendations   # AI-generated advice
market_data_cache    # Cached protocol data (Aave V3, TraderJoe, YieldYak)
```

### Updated Schema for Aave V3

Portfolio snapshots now include:

- `aave_amount` - Aave V3 allocation amounts
- `traderjoe_amount` - TraderJoe LP amounts
- `yieldyak_amount` - YieldYak farming amounts

## 🔗 Smart Contract Integration

The backend interacts with the YieldOptimizer contract for Aave V3 integration:

```typescript
// Key methods
getUserPortfolio(address);
allocateFunds(amounts, riskScore); // Now includes Aave V3 allocation
withdrawAll();
getProtocolBalances(); // Returns Aave, TraderJoe, YieldYak balances
getCurrentYields(); // Aave APY mapped from contract
```

### Protocol Mappings

- **Contract Index 0**: Aave V3
- **Contract Index 1**: TraderJoe
- **Contract Index 2**: YieldYak

## 📊 Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-01T00:00:00Z"
}

// Error
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🛡️ Security

- Rate limiting (100 req/15min)
- Input validation
- CORS protection
- Helmet.js headers
- Error sanitization

## 📝 Scripts

```bash
npm run dev         # Development server with hot reload
npm run build       # TypeScript compilation
npm run start       # Production server
npm run seed        # Seed demo data
npm run test        # Run tests (TBD)
npm run clean       # Clean build artifacts
```

## 📋 Requirements

- **Runtime**: Node.js 18+
- **Database**: SQLite3
- **Network**: Avalanche C-Chain access
- **Contract**: Deployed YieldOptimizer
