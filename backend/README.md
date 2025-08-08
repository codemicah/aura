# Personal DeFi Wealth Manager - Backend API

Backend API for the Personal DeFi Wealth Manager, an AI-powered yield optimization platform for Avalanche DeFi protocols.

## 🏗️ Architecture

```
src/
├── controllers/        # Request handlers and business logic
├── middleware/        # Express middleware (auth, validation, etc.)
├── routes/           # API route definitions
├── services/         # External service integrations
│   ├── blockchain.ts # Ethereum/Avalanche blockchain interaction
│   ├── database.ts   # SQLite database operations
│   └── defi.ts      # DeFi protocol data aggregation
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and configuration
└── index.ts         # Application entry point
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

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build the application
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

## 📡 API Endpoints

### Portfolio Management (`/api/v1/portfolio`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:address` | Get user portfolio data |
| GET | `/:address/balance` | Get user AVAX balance |
| GET | `/:address/rebalance-recommendation` | Get AI rebalancing advice |
| GET | `/transaction/:hash` | Get transaction status |
| GET | `/gas-price` | Get current gas prices |
| GET | `/health` | Service health check |

### Market Data (`/api/v1/market`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/yields` | Current protocol yields |
| GET | `/data` | Comprehensive market data |
| GET | `/avax-price` | Current AVAX price |
| GET | `/protocol/:protocol` | Specific protocol data |
| GET | `/protocol/:protocol/history` | Historical yields |
| DELETE | `/cache` | Clear data cache |
| GET | `/cache/stats` | Cache statistics |

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
API_BASE_PATH=/api/v1

# Database
DATABASE_PATH=./data/defi-manager.db

# Blockchain
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CHAIN_ID=43113

# Smart Contracts (Deploy contracts first!)
YIELD_OPTIMIZER_MAINNET=0x...
YIELD_OPTIMIZER_FUJI=0x...

# Security
API_RATE_LIMIT=100
JWT_SECRET=your-secret-key

# External APIs
COINGECKO_API_KEY=your-coingecko-key
```

## 🗄️ Database Schema

The backend uses SQLite with the following tables:

- **user_profiles** - User risk profiles and preferences
- **transactions** - Transaction history and status
- **ai_recommendations** - AI-generated investment advice  
- **portfolio_snapshots** - Historical portfolio data
- **market_data_cache** - Cached market data for performance

## 🔗 Blockchain Integration

### Supported Networks

- **Avalanche C-Chain (43114)** - Production
- **Avalanche Fuji (43113)** - Testing

### Smart Contract Integration

The backend integrates with the YieldOptimizer smart contract deployed on Avalanche networks:

```typescript
// Contract methods used:
- getUserPortfolio(address) 
- getCurrentYields()
- getRebalanceRecommendation(address)
```

**⚠️ Important**: Deploy the YieldOptimizer smart contract before using the API.

## 🧠 DeFi Protocol Integration

### Supported Protocols

1. **Benqi** - Lending/borrowing yields
2. **TraderJoe** - DEX liquidity provision yields  
3. **YieldYak** - Auto-compounding farming yields

### Data Sources

- **On-chain**: Smart contract calls for real-time data
- **Off-chain**: Protocol APIs for supplementary data
- **Price feeds**: CoinGecko for AVAX/USD pricing
- **Caching**: 5-minute cache for external API calls

## 📊 API Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-01T00:00:00.000Z"
}

// Error Response  
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🛡️ Security Features

- **Rate Limiting** - 100 requests per 15-minute window
- **CORS Protection** - Configurable allowed origins
- **Input Validation** - Ethereum address validation
- **Error Handling** - Comprehensive error catching
- **Security Headers** - Helmet.js implementation
- **Request Logging** - Morgan + custom logging

## 🚨 Error Handling

The API implements comprehensive error handling:

```typescript
// Custom Error Types
- APIError - General API errors
- ValidationError - Input validation errors  
- NotFoundError - Resource not found errors

// HTTP Status Codes
- 200: Success
- 400: Bad Request / Validation Error
- 404: Not Found
- 429: Too Many Requests  
- 503: Service Unavailable (contract not deployed)
- 500: Internal Server Error
```

## 📈 Monitoring & Logging

### Health Checks

- `GET /health` - Basic server health
- `GET /api/v1/portfolio/health` - Full service health including blockchain and DeFi protocols

### Logging Levels

- **Error** - Critical failures
- **Warn** - Important warnings  
- **Info** - General information
- **Debug** - Detailed debugging (dev only)

### Log Outputs

- **Console** - Development and error logs
- **File** - Production logs in `./logs/app.log`

## 🧪 Development

### Running Tests

```bash
# Tests not implemented yet
npm test  
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Build check
npm run build

# Clean build
npm run clean && npm run build
```

### Development Tools

- **TypeScript** - Type safety
- **Nodemon** - Auto-restart on changes
- **ts-node** - Direct TypeScript execution
- **ESLint** - Code linting (to be configured)

## 🚀 Production Deployment

### Build Process

```bash
# Clean and build
npm run clean
npm run build

# Start production server
NODE_ENV=production npm start
```

### Production Requirements

- Deploy YieldOptimizer smart contracts to target networks
- Configure production environment variables
- Set up database backup strategy
- Configure reverse proxy (nginx/Apache)
- Set up monitoring and alerting
- Configure SSL/TLS certificates

## 🤝 Integration with Frontend

The backend is designed to work seamlessly with the Next.js frontend:

- **CORS configured** for localhost:3000 (development)
- **Consistent API responses** matching frontend expectations
- **Real-time data** with caching for performance
- **Error handling** compatible with frontend notification system

## 📋 Known Limitations

1. **Contract Deployment Required** - API will return 503 errors until contracts are deployed
2. **Mock Historical Data** - Historical yield data is currently mocked
3. **Limited Protocol APIs** - Some protocols may have restricted API access
4. **No Authentication** - Currently operates without user authentication
5. **SQLite Database** - Not suitable for high-concurrency production use

## 🛠️ Troubleshooting

### Common Issues

**"No contract deployed for chain X"**
- Deploy the YieldOptimizer smart contract first
- Update contract addresses in environment variables

**Database errors**
- Ensure `./data/` directory exists and is writable
- Check SQLite installation

**RPC connection failures**  
- Verify Avalanche RPC URLs are accessible
- Check network connectivity

**API rate limits**
- Reduce request frequency
- Check external API quotas (CoinGecko, etc.)

---

## 📞 Support

For issues and questions:

1. Check this README
2. Review error logs in `./logs/app.log`
3. Verify environment configuration
4. Ensure all dependencies are installed