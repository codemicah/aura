# Smart Contracts Documentation

## Overview

The Personal DeFi Wealth Manager uses a modular smart contract architecture deployed on Avalanche C-Chain. The main contract (`YieldOptimizer`) manages user deposits and allocations across three DeFi protocols through adapter interfaces.

## Contract Architecture

```
YieldOptimizer.sol (Main Contract)
    ├── IBenqi.sol (Lending Protocol Interface)
    ├── ITraderJoe.sol (DEX/LP Interface)
    └── IYieldYak.sol (Yield Farming Interface)
```

## Deployed Addresses

### Avalanche Mainnet (Chain ID: 43114)

```
YieldOptimizer: 0x... (To be deployed)
```

### Fuji Testnet (Chain ID: 43113)

```
YieldOptimizer: 0x... (To be deployed)
```

## Main Contract: YieldOptimizer

### Purpose

Manages user deposits, risk-based allocation strategies, and interactions with DeFi protocols.

### Key Features

- Non-custodial design (users retain control)
- Risk-based automatic allocation
- Emergency withdrawal mechanism
- Gas-optimized operations
- Reentrancy protection

### Constructor

```solidity
constructor(
    address _benqiAddress,
    address _traderJoeAddress,
    address _yieldYakAddress
)
```

**Parameters:**

- `_benqiAddress`: Aave protocol contract address
- `_traderJoeAddress`: TraderJoe router contract address
- `_yieldYakAddress`: YieldYak vault contract address

### Core Functions

#### deposit

```solidity
function deposit(uint8 _riskScore) external payable
```

Deposits AVAX and allocates across protocols based on risk score.

**Parameters:**

- `_riskScore`: User's risk score (0-100)

**Requirements:**

- Minimum deposit: 0.1 AVAX
- Valid risk score: 0-100

**Events:**

- `Deposited(address indexed user, uint256 amount, uint8 riskScore)`

#### withdraw

```solidity
function withdraw(uint256 _amount) external nonReentrant
```

Withdraws specified amount from user's portfolio.

**Parameters:**

- `_amount`: Amount to withdraw in wei

**Requirements:**

- Sufficient balance
- Non-zero amount

**Events:**

- `Withdrawn(address indexed user, uint256 amount)`

#### rebalance

```solidity
function rebalance() external nonReentrant
```

Rebalances user's portfolio to match target allocation.

**Requirements:**

- User must have deposits
- Gas fee consideration

**Events:**

- `Rebalanced(address indexed user, uint256 timestamp)`

#### emergencyWithdraw

```solidity
function emergencyWithdraw() external nonReentrant
```

Emergency withdrawal of all user funds.

**Requirements:**

- User must have deposits

**Events:**

- `EmergencyWithdrawal(address indexed user, uint256 amount)`

### View Functions

#### getUserPortfolio

```solidity
function getUserPortfolio(address _user) external view returns (
    uint256 totalValue,
    uint256 benqiBalance,
    uint256 traderJoeBalance,
    uint256 yieldYakBalance,
    uint8 riskScore,
    uint256 lastRebalance
)
```

Returns complete portfolio information for a user.

#### calculateAllocation

```solidity
function calculateAllocation(
    uint8 _riskScore,
    uint256 _amount
) public pure returns (
    uint256 benqiAmount,
    uint256 traderJoeAmount,
    uint256 yieldYakAmount
)
```

Calculates protocol allocation based on risk score.

**Allocation Strategy:**

- **Conservative (0-33)**: 70% Aave, 30% TraderJoe, 0% YieldYak
- **Balanced (34-66)**: 40% Aave, 40% TraderJoe, 20% YieldYak
- **Aggressive (67-100)**: 20% Aave, 30% TraderJoe, 50% YieldYak

#### getRebalanceRecommendation

```solidity
function getRebalanceRecommendation(address _user) external view returns (
    bool shouldRebalance,
    uint256 currentBenqiPercentage,
    uint256 currentTraderJoePercentage,
    uint256 currentYieldYakPercentage,
    uint256 targetBenqiPercentage,
    uint256 targetTraderJoePercentage,
    uint256 targetYieldYakPercentage
)
```

Analyzes portfolio and recommends rebalancing if needed.

### Admin Functions

#### updateProtocolAddresses

```solidity
function updateProtocolAddresses(
    address _benqiAddress,
    address _traderJoeAddress,
    address _yieldYakAddress
) external onlyOwner
```

Updates protocol integration addresses.

**Access Control:** Owner only

#### updateYields

```solidity
function updateYields(
    uint256 _benqiAPY,
    uint256 _traderJoeAPY,
    uint256 _yieldYakAPY
) external onlyOwner
```

Updates protocol yield rates for calculations.

**Access Control:** Owner only

### Events

```solidity
event Deposited(address indexed user, uint256 amount, uint8 riskScore);
event Withdrawn(address indexed user, uint256 amount);
event Rebalanced(address indexed user, uint256 timestamp);
event EmergencyWithdrawal(address indexed user, uint256 amount);
event YieldsUpdated(uint256 benqiAPY, uint256 traderJoeAPY, uint256 yieldYakAPY);
event ProtocolAddressesUpdated(address aave, address traderJoe, address yieldYak);
```

## Protocol Interfaces

### IBenqi

```solidity
interface IBenqi {
    function mint() external payable;
    function redeem(uint256 redeemTokens) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function exchangeRateStored() external view returns (uint256);
}
```

### ITraderJoe

```solidity
interface ITraderJoe {
    function addLiquidityAVAX(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountAVAXMin,
        address to,
        uint256 deadline
    ) external payable returns (
        uint256 amountToken,
        uint256 amountAVAX,
        uint256 liquidity
    );

    function removeLiquidityAVAX(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountAVAXMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountAVAX);
}
```

### IYieldYak

```solidity
interface IYieldYak {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function getPricePerFullShare() external view returns (uint256);
}
```

## Security Considerations

### Implemented Security Measures

1. **ReentrancyGuard**: All state-changing functions protected
2. **Ownable**: Admin functions restricted to owner
3. **SafeERC20**: Safe token transfer operations
4. **Input Validation**: All inputs validated
5. **Minimum Deposits**: Prevents dust attacks

### Auditing Recommendations

1. Formal verification of allocation logic
2. Economic attack vector analysis
3. Gas optimization review
4. Integration testing with live protocols
5. Upgrade mechanism consideration

### Known Limitations

1. Single owner control (consider multisig)
2. No pause mechanism (consider emergency pause)
3. Protocol risk exposure
4. Impermanent loss not calculated

## Gas Optimization

### Gas Costs (Estimated)

- Deposit: ~150,000 gas
- Withdraw: ~120,000 gas
- Rebalance: ~250,000 gas
- Emergency Withdraw: ~100,000 gas

### Optimization Techniques

1. Storage packing for user data
2. Minimal external calls
3. Batch operations where possible
4. Event emission optimization

## Testing

### Test Coverage

- Unit Tests: 21 tests, 100% passing
- Fuzz Tests: 256 runs on risk scores
- Gas Tests: All functions under 300k gas

### Test Categories

1. **Deployment Tests**: Constructor validation
2. **Risk Profile Tests**: Allocation calculations
3. **Edge Case Tests**: Boundary conditions
4. **Access Control Tests**: Permission validation
5. **Integration Tests**: Protocol interactions

### Running Tests

```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testDeposit

# Run with coverage
forge coverage
```

## Deployment

### Prerequisites

1. Install Foundry
2. Configure environment variables
3. Fund deployer wallet with AVAX

### Deployment Script

```bash
# Deploy to local Anvil
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to Fuji Testnet
forge script script/Deploy.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Deploy to Mainnet
forge script script/Deploy.s.sol \
  --rpc-url https://api.avax.network/ext/bc/C/rpc \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

### Post-Deployment

1. Verify contract on Snowtrace
2. Update protocol addresses if needed
3. Set initial yield rates
4. Transfer ownership to multisig
5. Update frontend with contract address

## Upgrade Strategy

### Current Version

- Version: 1.0.0
- Deployment: Initial release

### Future Upgrades

1. Implement proxy pattern for upgradability
2. Add governance mechanism
3. Integrate additional protocols
4. Cross-chain functionality
5. Advanced yield strategies

## Integration Guide

### Frontend Integration

```javascript
import { ethers } from "ethers";
import YieldOptimizerABI from "./abis/YieldOptimizer.json";

const contract = new ethers.Contract(
  YIELD_OPTIMIZER_ADDRESS,
  YieldOptimizerABI,
  signer
);

// Deposit
const tx = await contract.deposit(riskScore, {
  value: ethers.parseEther("1.0"),
});

// Get portfolio
const portfolio = await contract.getUserPortfolio(userAddress);
```

### Backend Integration

```javascript
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(
  YIELD_OPTIMIZER_ADDRESS,
  YieldOptimizerABI,
  provider
);

// Monitor events
contract.on("Deposited", (user, amount, riskScore) => {
  console.log(`User ${user} deposited ${amount} with risk ${riskScore}`);
});
```

## Support & Resources

- [GitHub Repository](https://github.com/defi-manager/contracts)
- [Snowtrace Verification](https://snowtrace.io/address/0x...)
- [Technical Support](mailto:contracts@defi-manager.xyz)
- [Bug Bounty Program](https://immunefi.com/bounty/defi-manager)
