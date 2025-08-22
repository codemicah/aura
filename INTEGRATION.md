# Frontend-Backend AI Integration Guide

## Overview
This document outlines the complete integration between the frontend (Next.js + wagmi) and backend (Express + AI) for the Personal DeFi Wealth Manager.

## Architecture

```
Frontend (Next.js)          Backend (Express)         Blockchain (Avalanche)
     │                           │                            │
     ├──API Calls──────────────> │                            │
     │                           ├──AI Processing             │
     │                           ├──Database Storage          │
     │                           └──DeFi Data Aggregation     │
     │                                                        │
     └──Smart Contract Calls──────────────────────────────> │
```

## Integration Components

### 1. AI Risk Assessment Flow

**Frontend Components:**
- `RiskAssessment.tsx`: Enhanced questionnaire with 8 questions
- `useRiskAssessment()`: Hook for API integration
- `useAllocationStrategy()`: Automatic allocation generation

**Backend Endpoints:**
- `POST /api/v1/ai/risk-score`: Calculate risk score (0-100)
- `POST /api/v1/ai/allocation`: Generate allocation strategy
- `GET /api/v1/ai/risk-profiles`: Get all risk profiles

**Data Flow:**
1. User completes risk assessment questionnaire
2. Frontend sends answers to backend AI
3. Backend calculates risk score using weighted algorithm
4. Backend generates allocation strategy based on score
5. Frontend displays results and stores in localStorage

### 2. Investment Recommendation System

**Frontend Components:**
- `InvestmentFlow.tsx`: Complete investment interface
- `useAIRecommendations()`: Hook for AI recommendations
- `useSurplusCalculator()`: Financial surplus analysis

**Backend Endpoints:**
- `POST /api/v1/ai/recommendation`: Get personalized recommendations
- `POST /api/v1/ai/surplus`: Calculate investable surplus
- `POST /api/v1/ai/analyze-portfolio`: Portfolio analysis

**Features:**
- Real-time AI recommendations based on portfolio value
- Confidence scoring (0.6-0.8 range)
- Risk-adjusted allocation suggestions
- Market-responsive adjustments (±10% based on yields)

### 3. Market Data Integration

**Frontend Components:**
- `useMarketDashboard()`: Combined market data hook
- `useProtocolYields()`: Real-time yield tracking
- `useAVAXPrice()`: AVAX price monitoring

**Backend Services:**
- `DeFiDataService`: Protocol data aggregation
- 5-minute cache for performance
- Fallback values for reliability

**Data Sources:**
- Benqi: Lending APY (mock: 5.2%)
- TraderJoe: LP APY (mock: 8.7%)
- YieldYak: Farming APY (mock: 12.4%)
- CoinGecko: AVAX price data

### 4. Portfolio Tracking

**Frontend Components:**
- `usePortfolioDashboard()`: Complete portfolio management
- `useTransactionHistory()`: Transaction tracking
- `usePortfolioHistory()`: Historical performance

**Backend Storage:**
- SQLite database with 5 tables
- User profiles with preferences
- AI recommendations tracking
- Portfolio snapshots for history
- Transaction records

**Features:**
- Real-time portfolio value in USD
- Performance metrics (daily/weekly/monthly)
- Allocation visualization
- Transaction status tracking

## API Integration Details

### Authentication
Currently using wallet address as identifier. Future enhancement: JWT tokens.

### Request Format
```javascript
// All API requests use JSON
{
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
}
```

### Response Format
```javascript
// Successful response
{
  success: true,
  data: { ... },
  timestamp: "2025-01-08T12:00:00Z"
}

// Error response
{
  success: false,
  error: "Error message",
  timestamp: "2025-01-08T12:00:00Z"
}
```

### Error Handling
- Frontend: Try-catch with fallback to local calculations
- Backend: Centralized error handler with logging
- User feedback via notification system

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

### Required Environment Variables

**Frontend (.env.local):**
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_WC_PROJECT_ID`: WalletConnect project ID
- `NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS`: Deployed contract address

**Backend (.env):**
- `PORT`: Server port (default: 3001)
- `DATABASE_PATH`: SQLite database location
- `AVALANCHE_RPC_URL`: Avalanche RPC endpoint

## Testing the Integration

### 1. Risk Assessment Test
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Navigate to http://localhost:3000
# Complete risk assessment
# Verify API calls in network tab
```

### 2. Investment Flow Test
1. Connect wallet
2. Complete risk assessment
3. View AI recommendations
4. Test deposit with allocation
5. Check portfolio updates

### 3. Market Data Test
- Verify real-time yield updates
- Check AVAX price refresh (60s interval)
- Test fallback mechanisms

## Performance Optimizations

### Frontend
- localStorage for persistent state
- Automatic refresh intervals
- Batched API calls
- Optimistic UI updates

### Backend
- 5-minute cache for DeFi data
- Database indexes for queries
- Connection pooling
- Rate limiting (100 req/15min)

## Security Considerations

### Frontend
- Input validation
- XSS prevention
- Secure wallet connections
- Environment variable protection

### Backend
- CORS configuration
- Helmet security headers
- Rate limiting
- SQL injection prevention
- Input sanitization

## Monitoring

### Frontend
- Console logging for debugging
- Error boundaries
- Transaction status tracking

### Backend
- Morgan request logging
- Custom logger with levels
- Health check endpoints
- Service status monitoring

## Future Enhancements

1. **WebSocket Integration**: Real-time updates without polling
2. **JWT Authentication**: Secure user sessions
3. **Advanced AI Features**: Machine learning for predictions
4. **Multi-chain Support**: Expand beyond Avalanche
5. **Mobile App**: React Native implementation
6. **Advanced Analytics**: Detailed performance metrics
7. **Social Features**: Compare with other users
8. **Automated Strategies**: DCA, stop-loss, take-profit

## Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure backend is running on correct port
- Check CORS configuration in middleware
- Verify frontend API URL

**Database Errors:**
- Check database file exists
- Verify write permissions
- Review database logs

**API Connection Failed:**
- Confirm backend is running
- Check network connectivity
- Verify environment variables

**Transaction Failures:**
- Check wallet balance
- Verify contract addresses
- Review gas settings

## Support

For issues or questions:
1. Check logs in both frontend and backend
2. Review error messages in browser console
3. Verify all services are running
4. Check environment configurations

## Week 3 Integration Status ✅

**Completed (Days 20-21):**
- ✅ Frontend-Backend API connection
- ✅ Full investment flow implementation
- ✅ Portfolio tracking system
- ✅ Real-time yield aggregation
- ✅ AI recommendation integration
- ✅ Market data synchronization
- ✅ Transaction management
- ✅ Error handling and notifications

The integration is now complete and ready for Week 4 polish and demo preparation.