// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/ITraderJoe.sol";
import "./interfaces/IBenqi.sol";
import "./interfaces/IYieldYak.sol";

contract YieldOptimizer is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserProfile {
        uint8 riskScore;          // 0-100 risk score
        uint256 totalDeposited;   // Total AVAX deposited
        uint256 lastRebalance;    // Timestamp of last rebalance
        bool autoRebalance;       // Auto-rebalance enabled
    }

    struct ProtocolAllocation {
        uint256 benqiAmount;      // Amount allocated to Benqi
        uint256 traderJoeAmount;  // Amount allocated to TraderJoe
        uint256 yieldYakAmount;   // Amount allocated to YieldYak
    }

    struct YieldData {
        uint256 benqiAPY;         // Benqi current APY (basis points)
        uint256 traderJoeAPY;     // TraderJoe current APY (basis points)
        uint256 yieldYakAPY;      // YieldYak current APY (basis points)
        uint256 lastUpdated;      // Timestamp of last yield update
    }

    // State variables
    mapping(address => UserProfile) public userProfiles;
    mapping(address => ProtocolAllocation) public userAllocations;
    YieldData public currentYields;

    // Protocol addresses (will be set in constructor or setter functions)
    address public traderJoeRouter;
    address public benqiComptroller;
    address public yieldYakFarm;
    
    // Constants
    uint256 public constant MIN_DEPOSIT = 0.01 ether;  // Minimum 0.01 AVAX
    uint256 public constant REBALANCE_THRESHOLD = 500; // 5% threshold in basis points
    uint256 public constant BASIS_POINTS = 10000;      // 100% = 10,000 basis points

    // Events
    event YieldOptimized(address indexed user, uint256 amount, uint8 riskScore);
    event Rebalanced(address indexed user, uint256 totalValue);
    event YieldsUpdated(uint256 benqiAPY, uint256 traderJoeAPY, uint256 yieldYakAPY);
    event Withdrawn(address indexed user, uint256 amount);
    event ProtocolAddressUpdated(string protocol, address newAddress);

    constructor() Ownable(msg.sender) {
        // Initialize with placeholder yields (will be updated by oracle/keeper)
        currentYields = YieldData({
            benqiAPY: 500,        // 5% APY
            traderJoeAPY: 800,    // 8% APY  
            yieldYakAPY: 1200,    // 12% APY
            lastUpdated: block.timestamp
        });
    }

    /**
     * @dev Main function to optimize yield based on user's risk profile
     * @param _riskScore Risk score from 0 (conservative) to 100 (aggressive)
     */
    function optimizeYield(uint8 _riskScore) external payable nonReentrant {
        require(msg.value >= MIN_DEPOSIT, "Deposit too small");
        require(_riskScore <= 100, "Invalid risk score");

        UserProfile storage profile = userProfiles[msg.sender];
        profile.riskScore = _riskScore;
        profile.totalDeposited += msg.value;
        profile.lastRebalance = block.timestamp;

        // Calculate allocation based on risk score
        _allocateFunds(msg.sender, msg.value, _riskScore);
        
        emit YieldOptimized(msg.sender, msg.value, _riskScore);
    }

    /**
     * @dev Internal function to allocate funds based on risk score
     * Conservative (0-33): 70% Benqi, 30% TraderJoe
     * Balanced (34-66): 40% Benqi, 40% TraderJoe, 20% YieldYak  
     * Aggressive (67-100): 20% Benqi, 30% TraderJoe, 50% YieldYak
     */
    function _allocateFunds(address user, uint256 amount, uint8 riskScore) internal {
        ProtocolAllocation storage allocation = userAllocations[user];
        
        uint256 benqiAllocation;
        uint256 traderJoeAllocation;
        uint256 yieldYakAllocation;

        if (riskScore <= 33) {
            // Conservative allocation
            benqiAllocation = (amount * 7000) / BASIS_POINTS;      // 70%
            traderJoeAllocation = (amount * 3000) / BASIS_POINTS;  // 30%
            yieldYakAllocation = 0;                                // 0%
        } else if (riskScore <= 66) {
            // Balanced allocation
            benqiAllocation = (amount * 4000) / BASIS_POINTS;      // 40%
            traderJoeAllocation = (amount * 4000) / BASIS_POINTS;  // 40%
            yieldYakAllocation = (amount * 2000) / BASIS_POINTS;   // 20%
        } else {
            // Aggressive allocation
            benqiAllocation = (amount * 2000) / BASIS_POINTS;      // 20%
            traderJoeAllocation = (amount * 3000) / BASIS_POINTS;  // 30%
            yieldYakAllocation = (amount * 5000) / BASIS_POINTS;   // 50%
        }

        // Update user's allocation tracking
        allocation.benqiAmount += benqiAllocation;
        allocation.traderJoeAmount += traderJoeAllocation;
        allocation.yieldYakAmount += yieldYakAllocation;

        // Execute the actual protocol interactions
        if (benqiAllocation > 0) {
            _depositToBenqi(benqiAllocation);
        }
        if (traderJoeAllocation > 0) {
            _depositToTraderJoe(traderJoeAllocation);
        }
        if (yieldYakAllocation > 0) {
            _depositToYieldYak(yieldYakAllocation);
        }
    }

    /**
     * @dev Get current yields from all protocols
     */
    function getCurrentYields() external view returns (
        uint256 benqiAPY,
        uint256 traderJoeAPY,
        uint256 yieldYakAPY,
        uint256 lastUpdated
    ) {
        return (
            currentYields.benqiAPY,
            currentYields.traderJoeAPY,
            currentYields.yieldYakAPY,
            currentYields.lastUpdated
        );
    }

    /**
     * @dev Get user's complete portfolio information
     */
    function getUserPortfolio(address user) external view returns (
        UserProfile memory profile,
        ProtocolAllocation memory allocation,
        uint256 estimatedValue
    ) {
        profile = userProfiles[user];
        allocation = userAllocations[user];
        
        // Calculate estimated current value (simplified calculation)
        estimatedValue = allocation.benqiAmount + allocation.traderJoeAmount + allocation.yieldYakAmount;
    }

    /**
     * @dev Calculate recommended rebalancing for a user
     */
    function getRebalanceRecommendation(address user) external view returns (
        bool shouldRebalance,
        uint256 newBenqiAllocation,
        uint256 newTraderJoeAllocation,
        uint256 newYieldYakAllocation
    ) {
        UserProfile memory profile = userProfiles[user];
        ProtocolAllocation memory current = userAllocations[user];
        
        if (profile.totalDeposited == 0) {
            return (false, 0, 0, 0);
        }

        // Calculate optimal allocation for current risk score
        uint256 totalValue = current.benqiAmount + current.traderJoeAmount + current.yieldYakAmount;
        
        (newBenqiAllocation, newTraderJoeAllocation, newYieldYakAllocation) = 
            _calculateOptimalAllocation(totalValue, profile.riskScore);

        // Check if rebalancing is needed (if current allocation deviates by more than threshold)
        shouldRebalance = _shouldRebalance(current, newBenqiAllocation, newTraderJoeAllocation, newYieldYakAllocation, totalValue);
    }

    /**
     * @dev Execute rebalancing for a user
     */
    function rebalance() external nonReentrant {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalDeposited > 0, "No deposits to rebalance");

        ProtocolAllocation storage allocation = userAllocations[msg.sender];
        uint256 totalValue = allocation.benqiAmount + allocation.traderJoeAmount + allocation.yieldYakAmount;

        (uint256 newBenqi, uint256 newTraderJoe, uint256 newYieldYak) = 
            _calculateOptimalAllocation(totalValue, profile.riskScore);

        // Execute rebalancing logic (withdraw and redeposit)
        _executeRebalance(msg.sender, allocation, newBenqi, newTraderJoe, newYieldYak);

        profile.lastRebalance = block.timestamp;
        emit Rebalanced(msg.sender, totalValue);
    }

    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() external nonReentrant {
        ProtocolAllocation storage allocation = userAllocations[msg.sender];
        UserProfile storage profile = userProfiles[msg.sender];
        
        uint256 totalWithdrawn = 0;

        // Withdraw from all protocols
        if (allocation.benqiAmount > 0) {
            totalWithdrawn += _withdrawFromBenqi(allocation.benqiAmount);
            allocation.benqiAmount = 0;
        }
        if (allocation.traderJoeAmount > 0) {
            totalWithdrawn += _withdrawFromTraderJoe(allocation.traderJoeAmount);
            allocation.traderJoeAmount = 0;
        }
        if (allocation.yieldYakAmount > 0) {
            totalWithdrawn += _withdrawFromYieldYak(allocation.yieldYakAmount);
            allocation.yieldYakAmount = 0;
        }

        profile.totalDeposited = 0;

        // Cap withdrawal at contract balance to prevent revert
        uint256 contractBalance = address(this).balance;
        uint256 toTransfer = totalWithdrawn > contractBalance ? contractBalance : totalWithdrawn;
        
        // Transfer withdrawn funds to user
        if (toTransfer > 0) {
            payable(msg.sender).transfer(toTransfer);
            emit Withdrawn(msg.sender, toTransfer);
        }
    }

    // Internal helper functions for protocol interactions
    function _depositToBenqi(uint256 amount) internal {
        // TODO: Implement Benqi deposit logic
        // This would interact with Benqi's qiAVAX contract
    }

    function _depositToTraderJoe(uint256 amount) internal {
        // TODO: Implement TraderJoe LP deposit logic
        // This would add liquidity to AVAX/USDC pair
    }

    function _depositToYieldYak(uint256 amount) internal {
        // TODO: Implement YieldYak farm deposit logic
        // This would stake in YieldYak farming strategies
    }

    function _withdrawFromBenqi(uint256 amount) internal returns (uint256) {
        // Mock implementation for hackathon demo
        // In production, this would interact with Benqi's qiAVAX contract
        // For demo purposes, we simulate withdrawal with potential yield gains
        uint256 withdrawnAmount = (amount * (10000 + currentYields.benqiAPY / 365)) / 10000;
        return withdrawnAmount;
    }

    function _withdrawFromTraderJoe(uint256 amount) internal returns (uint256) {
        // Mock implementation for hackathon demo
        // In production, this would interact with TraderJoe's LP contracts
        // For demo purposes, we simulate withdrawal with potential yield gains
        uint256 withdrawnAmount = (amount * (10000 + currentYields.traderJoeAPY / 365)) / 10000;
        return withdrawnAmount;
    }

    function _withdrawFromYieldYak(uint256 amount) internal returns (uint256) {
        // Mock implementation for hackathon demo
        // In production, this would interact with YieldYak's strategy contracts
        // For demo purposes, we simulate withdrawal with potential yield gains
        uint256 withdrawnAmount = (amount * (10000 + currentYields.yieldYakAPY / 365)) / 10000;
        return withdrawnAmount;
    }

    function _calculateOptimalAllocation(uint256 totalAmount, uint8 riskScore) 
        internal 
        pure 
        returns (uint256 benqi, uint256 traderJoe, uint256 yieldYak) 
    {
        if (riskScore <= 33) {
            benqi = (totalAmount * 7000) / BASIS_POINTS;
            traderJoe = (totalAmount * 3000) / BASIS_POINTS;
            yieldYak = 0;
        } else if (riskScore <= 66) {
            benqi = (totalAmount * 4000) / BASIS_POINTS;
            traderJoe = (totalAmount * 4000) / BASIS_POINTS;
            yieldYak = (totalAmount * 2000) / BASIS_POINTS;
        } else {
            benqi = (totalAmount * 2000) / BASIS_POINTS;
            traderJoe = (totalAmount * 3000) / BASIS_POINTS;
            yieldYak = (totalAmount * 5000) / BASIS_POINTS;
        }
    }

    function _shouldRebalance(
        ProtocolAllocation memory current,
        uint256 targetBenqi,
        uint256 targetTraderJoe,
        uint256 targetYieldYak,
        uint256 totalValue
    ) internal pure returns (bool) {
        uint256 benqiDiff = current.benqiAmount > targetBenqi ? 
            current.benqiAmount - targetBenqi : 
            targetBenqi - current.benqiAmount;
        
        uint256 threshold = (totalValue * REBALANCE_THRESHOLD) / BASIS_POINTS;
        
        return benqiDiff > threshold;
    }

    function _executeRebalance(
        address user,
        ProtocolAllocation storage current,
        uint256 targetBenqi,
        uint256 targetTraderJoe,
        uint256 targetYieldYak
    ) internal {
        // Calculate differences between current and target allocations
        int256 benqiDiff = int256(targetBenqi) - int256(current.benqiAmount);
        int256 traderJoeDiff = int256(targetTraderJoe) - int256(current.traderJoeAmount);
        int256 yieldYakDiff = int256(targetYieldYak) - int256(current.yieldYakAmount);
        
        uint256 totalWithdrawn = 0;
        
        // Step 1: Withdraw from over-allocated protocols
        if (benqiDiff < 0) {
            uint256 withdrawAmount = uint256(-benqiDiff);
            totalWithdrawn += _withdrawFromBenqi(withdrawAmount);
        }
        if (traderJoeDiff < 0) {
            uint256 withdrawAmount = uint256(-traderJoeDiff);
            totalWithdrawn += _withdrawFromTraderJoe(withdrawAmount);
        }
        if (yieldYakDiff < 0) {
            uint256 withdrawAmount = uint256(-yieldYakDiff);
            totalWithdrawn += _withdrawFromYieldYak(withdrawAmount);
        }
        
        // Step 2: Deposit to under-allocated protocols
        if (benqiDiff > 0) {
            _depositToBenqi(uint256(benqiDiff));
        }
        if (traderJoeDiff > 0) {
            _depositToTraderJoe(uint256(traderJoeDiff));
        }
        if (yieldYakDiff > 0) {
            _depositToYieldYak(uint256(yieldYakDiff));
        }
        
        // Update allocations to reflect new state
        current.benqiAmount = targetBenqi;
        current.traderJoeAmount = targetTraderJoe;
        current.yieldYakAmount = targetYieldYak;
    }

    // Owner functions
    function updateProtocolAddress(string calldata protocol, address newAddress) external onlyOwner {
        bytes32 protocolHash = keccak256(abi.encodePacked(protocol));
        
        if (protocolHash == keccak256(abi.encodePacked("traderjoe"))) {
            traderJoeRouter = newAddress;
        } else if (protocolHash == keccak256(abi.encodePacked("benqi"))) {
            benqiComptroller = newAddress;
        } else if (protocolHash == keccak256(abi.encodePacked("yieldyak"))) {
            yieldYakFarm = newAddress;
        } else {
            revert("Invalid protocol");
        }
        
        emit ProtocolAddressUpdated(protocol, newAddress);
    }

    function updateYields(uint256 _benqiAPY, uint256 _traderJoeAPY, uint256 _yieldYakAPY) external onlyOwner {
        currentYields.benqiAPY = _benqiAPY;
        currentYields.traderJoeAPY = _traderJoeAPY;
        currentYields.yieldYakAPY = _yieldYakAPY;
        currentYields.lastUpdated = block.timestamp;
        
        emit YieldsUpdated(_benqiAPY, _traderJoeAPY, _yieldYakAPY);
    }
}