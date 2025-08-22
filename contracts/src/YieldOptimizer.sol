// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/ITraderJoe.sol";
import "./interfaces/IAave.sol";
import "./interfaces/IYieldYak.sol";
import "./interfaces/IWAVAX.sol";

contract YieldOptimizer is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserProfile {
        uint8 riskScore; // 0-100 risk score
        uint256 totalDeposited; // Total AVAX deposited
        uint256 lastRebalance; // Timestamp of last rebalance
        bool autoRebalance; // Auto-rebalance enabled
    }

    struct ProtocolAllocation {
        uint256 aaveAmount; // Amount allocated to Aave
        uint256 traderJoeAmount; // Amount allocated to TraderJoe
        uint256 yieldYakAmount; // Amount allocated to YieldYak
    }

    struct YieldData {
        uint256 aaveAPY; // Aave current APY (basis points)
        uint256 traderJoeAPY; // TraderJoe current APY (basis points)
        uint256 yieldYakAPY; // YieldYak current APY (basis points)
        uint256 lastUpdated; // Timestamp of last yield update
    }

    // State variables
    mapping(address => UserProfile) public userProfiles;
    mapping(address => ProtocolAllocation) public userAllocations;
    YieldData public currentYields;

    // Protocol addresses (will be set in constructor or setter functions)
    address public traderJoeRouter;
    address public yieldYakFarm;

    // TraderJoe specific addresses - now configurable
    address public WAVAX;
    address public USDC;
    address public traderJoePair; // AVAX/USDC LP token address

    // Constants
    uint256 public constant MIN_DEPOSIT = 0.01 ether; // Minimum 0.01 AVAX
    uint256 public constant REBALANCE_THRESHOLD = 500; // 5% threshold in basis points
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10,000 basis points

    // Events
    event YieldOptimized(address indexed user, uint256 amount, uint8 riskScore);
    event Rebalanced(address indexed user, uint256 totalValue);
    event YieldsUpdated(
        uint256 aaveAPY,
        uint256 traderJoeAPY,
        uint256 yieldYakAPY
    );
    event Withdrawn(address indexed user, uint256 amount);
    event ProtocolAddressUpdated(string protocol, address newAddress);

    // Backend coordination events
    event AaveDepositRequested(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event AaveWithdrawalRequested(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event BackendAction(
        string action,
        address indexed user,
        uint256 amount,
        bytes32 requestId
    );

    constructor(
        address _traderJoeRouter,
        address _yieldYakFarm,
        address _wavax,
        address _usdc
    ) Ownable(msg.sender) {
        // Set protocol addresses
        traderJoeRouter = _traderJoeRouter;
        yieldYakFarm = _yieldYakFarm;
        WAVAX = _wavax;
        USDC = _usdc;
        traderJoePair = 0x099deb72844417148E8ee4aA6752d138BedE0c39;

        // Initialize with placeholder yields (will be updated by oracle/keeper)
        currentYields = YieldData({
            aaveAPY: 500, // 5% APY
            traderJoeAPY: 800, // 8% APY
            yieldYakAPY: 1200, // 12% APY
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
     * Conservative (0-33): 70% Aave, 30% TraderJoe
     * Balanced (34-66): 40% Aave, 40% TraderJoe, 20% YieldYak
     * Aggressive (67-100): 20% Aave, 30% TraderJoe, 50% YieldYak
     */
    function _allocateFunds(
        address user,
        uint256 amount,
        uint8 riskScore
    ) internal {
        ProtocolAllocation storage allocation = userAllocations[user];

        uint256 aaveAllocation;
        uint256 traderJoeAllocation;
        uint256 yieldYakAllocation;

        if (riskScore <= 33) {
            // Conservative allocation
            aaveAllocation = (amount * 7000) / BASIS_POINTS; // 70%
            traderJoeAllocation = (amount * 3000) / BASIS_POINTS; // 30%
            yieldYakAllocation = 0; // 0%
        } else if (riskScore <= 66) {
            // Balanced allocation
            aaveAllocation = (amount * 4000) / BASIS_POINTS; // 40%
            traderJoeAllocation = (amount * 4000) / BASIS_POINTS; // 40%
            yieldYakAllocation = (amount * 2000) / BASIS_POINTS; // 20%
        } else {
            // Aggressive allocation
            aaveAllocation = (amount * 2000) / BASIS_POINTS; // 20%
            traderJoeAllocation = (amount * 3000) / BASIS_POINTS; // 30%
            yieldYakAllocation = (amount * 5000) / BASIS_POINTS; // 50%
        }

        // Update user's allocation tracking
        allocation.aaveAmount += aaveAllocation;
        allocation.traderJoeAmount += traderJoeAllocation;
        allocation.yieldYakAmount += yieldYakAllocation;

        // Execute the actual protocol interactions
        if (aaveAllocation > 0) {
            _depositToAave(aaveAllocation);
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
    function getCurrentYields()
        external
        view
        returns (
            uint256 aaveAPY,
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,
            uint256 lastUpdated
        )
    {
        return (
            currentYields.aaveAPY,
            currentYields.traderJoeAPY,
            currentYields.yieldYakAPY,
            currentYields.lastUpdated
        );
    }

    /**
     * @dev Get user's complete portfolio information
     */
    function getUserPortfolio(
        address user
    )
        external
        view
        returns (
            UserProfile memory profile,
            ProtocolAllocation memory allocation,
            uint256 estimatedValue
        )
    {
        profile = userProfiles[user];
        allocation = userAllocations[user];

        // Calculate estimated current value (simplified calculation)
        estimatedValue =
            allocation.aaveAmount +
            allocation.traderJoeAmount +
            allocation.yieldYakAmount;
    }

    /**
     * @dev Calculate recommended rebalancing for a user
     */
    function getRebalanceRecommendation(
        address user
    )
        external
        view
        returns (
            bool shouldRebalance,
            uint256 newAaveAllocation,
            uint256 newTraderJoeAllocation,
            uint256 newYieldYakAllocation
        )
    {
        UserProfile memory profile = userProfiles[user];
        ProtocolAllocation memory current = userAllocations[user];

        if (profile.totalDeposited == 0) {
            return (false, 0, 0, 0);
        }

        // Calculate optimal allocation for current risk score
        uint256 totalValue = current.aaveAmount +
            current.traderJoeAmount +
            current.yieldYakAmount;

        (
            newAaveAllocation,
            newTraderJoeAllocation,
            newYieldYakAllocation
        ) = _calculateOptimalAllocation(totalValue, profile.riskScore);

        // Check if rebalancing is needed (if current allocation deviates by more than threshold)
        shouldRebalance = _shouldRebalance(
            current,
            newAaveAllocation,
            newTraderJoeAllocation,
            newYieldYakAllocation,
            totalValue
        );
    }

    /**
     * @dev Execute rebalancing for a user
     */
    function rebalance() external nonReentrant {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalDeposited > 0, "No deposits to rebalance");

        ProtocolAllocation storage allocation = userAllocations[msg.sender];
        uint256 totalValue = allocation.aaveAmount +
            allocation.traderJoeAmount +
            allocation.yieldYakAmount;

        (
            uint256 newAave,
            uint256 newTraderJoe,
            uint256 newYieldYak
        ) = _calculateOptimalAllocation(totalValue, profile.riskScore);

        // Execute rebalancing logic (withdraw and redeposit)
        _executeRebalance(
            msg.sender,
            allocation,
            newAave,
            newTraderJoe,
            newYieldYak
        );

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
        if (allocation.aaveAmount > 0) {
            totalWithdrawn += _withdrawFromAave(allocation.aaveAmount);
            allocation.aaveAmount = 0;
        }
        if (allocation.traderJoeAmount > 0) {
            totalWithdrawn += _withdrawFromTraderJoe(
                allocation.traderJoeAmount
            );
            allocation.traderJoeAmount = 0;
        }
        if (allocation.yieldYakAmount > 0) {
            totalWithdrawn += _withdrawFromYieldYak(allocation.yieldYakAmount);
            allocation.yieldYakAmount = 0;
        }

        profile.totalDeposited = 0;

        // Cap withdrawal at contract balance to prevent revert
        uint256 contractBalance = address(this).balance;
        uint256 toTransfer = totalWithdrawn > contractBalance
            ? contractBalance
            : totalWithdrawn;

        // Transfer withdrawn funds to user
        if (toTransfer > 0) {
            payable(msg.sender).transfer(toTransfer);
            emit Withdrawn(msg.sender, toTransfer);
        }
    }

    // Internal helper functions for protocol interactions
    function _depositToAave(uint256 amount) internal {
        require(amount > 0, "Amount must be greater than zero");

        // Backend-managed approach: Contract holds funds, backend does the yield farming
        // Emit event for backend to process
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, amount, block.timestamp)
        );
        emit AaveDepositRequested(msg.sender, amount, block.timestamp);
        emit BackendAction("AAVE_DEPOSIT", msg.sender, amount, requestId);

        // Contract keeps the AVAX - backend will manage external yield farming
        // This enables testnet operation and production flexibility
    }

    function _depositToTraderJoe(uint256 amount) internal {
        // MOCK IMPLEMENTATION FOR TESTING
        // Comment out the actual TraderJoe integration for now and use a simple mock

        // // Uses traderJoeRouter for swaps and liquidity operations
        // require(traderJoeRouter != address(0), "TraderJoe router not set");
        // // Uses traderJoePair for tracking LP tokens received
        // require(traderJoePair != address(0), "TraderJoe pair not set");

        // Simple mock: just emit an event to track the deposit
        emit BackendAction(
            "TRADERJOE_DEPOSIT_MOCK",
            msg.sender,
            amount,
            keccak256(abi.encodePacked(msg.sender, amount, block.timestamp))
        );

        // Update user's TraderJoe allocation (mock)
        userAllocations[msg.sender].traderJoeAmount += amount;

        // For now, just keep the amount as ETH (no actual swapping/liquidity provision)
        // In a real implementation, this would be LP tokens from TraderJoe

        return;

        /* COMMENTED OUT - ORIGINAL TRADERJOE IMPLEMENTATION
        // Check if we're in a test environment by checking code size
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(sload(traderJoeRouter.slot))
        }

        // If no code at traderJoeRouter address (test environment), skip actual implementation
        if (codeSize == 0) {
            // For test environments: just simulate the deposit without external calls
            // Emit an event for tracking in test environment
            emit BackendAction(
                "TRADERJOE_DEPOSIT_SIMULATED",
                msg.sender,
                amount,
                keccak256(abi.encodePacked(msg.sender, amount, block.timestamp))
            );
            return;
        }

        // Check if WAVAX and USDC contracts exist (additional safety for testnet)
        uint256 wavaxCodeSize;
        uint256 usdcCodeSize;
        assembly {
            wavaxCodeSize := extcodesize(sload(WAVAX.slot))
            usdcCodeSize := extcodesize(sload(USDC.slot))
        }

        if (wavaxCodeSize == 0 || usdcCodeSize == 0) {
            // Token contracts don't exist, simulate the deposit
            emit BackendAction(
                "TRADERJOE_DEPOSIT_SIMULATED",
                msg.sender,
                amount,
                keccak256(abi.encodePacked(msg.sender, amount, block.timestamp))
            );
            return;
        }

        // Get user's risk score for risk-based allocation
        uint8 riskScore = userProfiles[msg.sender].riskScore;

        // Calculate risk-based allocation ratios
        (, uint256 usdcRatio) = _getTraderJoeAllocationRatio(riskScore);

        // Split AVAX based on risk profile
        uint256 avaxToSwap = (amount * usdcRatio) / BASIS_POINTS;
        uint256 avaxForLiquidity = amount - avaxToSwap;

        // Swap portion of AVAX to USDC based on risk profile
        uint256 usdcAmount = _swapAVAXForUSDC(avaxToSwap);

        // Add liquidity with risk-adjusted amounts
        _addLiquidity(avaxForLiquidity, usdcAmount);
        */
    }

    /* COMMENTED OUT - TRADERJOE HELPER FUNCTIONS NO LONGER NEEDED
    /**
     * @dev Swap AVAX for USDC using TraderJoe router
     */
    /*
    function _swapAVAXForUSDC(
        uint256 avaxAmount
    ) internal returns (uint256 usdcAmount) {
        address[] memory path = new address[](2);
        path[0] = WAVAX;
        path[1] = USDC;

        // Get expected USDC amount (with 1% slippage tolerance)
        uint256[] memory amountsOut = ITraderJoe(traderJoeRouter).getAmountsOut(
            avaxAmount,
            path
        );
        uint256 minUSDCOut = (amountsOut[1] * 9900) / 10000; // 1% slippage

        // Execute swap
        uint256[] memory amounts = ITraderJoe(traderJoeRouter)
            .swapExactAVAXForTokens{value: avaxAmount}(
            minUSDCOut,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );

        return amounts[1];
    }

    /**
     * @dev Add liquidity to AVAX/USDC pair
     */
    /*
    function _addLiquidity(uint256 avaxAmount, uint256 usdcAmount) internal {
        // Approve USDC spending
        IERC20(USDC).approve(traderJoeRouter, usdcAmount);

        // Add liquidity with 1% slippage tolerance
        uint256 minAVAXAmount = (avaxAmount * 9900) / 10000;
        uint256 minUSDCAmount = (usdcAmount * 9900) / 10000;

        ITraderJoe(traderJoeRouter).addLiquidityAVAX{value: avaxAmount}(
            USDC,
            usdcAmount,
            minUSDCAmount,
            minAVAXAmount,
            address(this), // LP tokens sent to this contract
            block.timestamp + 300 // 5 minute deadline
        );
    }
    */

    function _depositToYieldYak(uint256 amount) internal {
        // MOCK IMPLEMENTATION FOR TESTING
        // Comment out the actual YieldYak integration for now and use a simple mock

        // require(yieldYakFarm != address(0), "YieldYak farm not set");
        require(amount > 0, "Amount must be greater than zero");

        // Simple mock: just emit an event to track the deposit
        emit BackendAction(
            "YIELDYAK_DEPOSIT_MOCK",
            msg.sender,
            amount,
            keccak256(abi.encodePacked(msg.sender, amount, block.timestamp))
        );

        // Allocation already handled in _allocateFunds; do not increment again

        // For now, just keep the amount as ETH (no actual YieldYak farming)
        // In a real implementation, this would be YieldYak receipt tokens

        return;

        /* COMMENTED OUT - ORIGINAL YIELDYAK IMPLEMENTATION
        // Check if we're in a test environment by checking code size
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(sload(yieldYakFarm.slot))
        }

        // If no code at yieldYakFarm address (test environment), skip actual implementation
        if (codeSize == 0) {
            // For test environments: just simulate the deposit without external calls
            emit BackendAction(
                "YIELDYAK_DEPOSIT_SIMULATED",
                msg.sender,
                amount,
                keccak256(abi.encodePacked(msg.sender, amount, block.timestamp))
            );
            return;
        }

        // Production implementation: Deposit AVAX directly to YieldYak farm
        // YieldYak accepts native AVAX deposits for yield farming strategies
        IYieldYak(yieldYakFarm).deposit{value: amount}();
        */
    }

    function _withdrawFromAave(uint256 amount) internal returns (uint256) {
        // Backend-managed approach: Request withdrawal from backend service
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, amount, block.timestamp, "withdraw")
        );
        emit AaveWithdrawalRequested(msg.sender, amount, block.timestamp);
        emit BackendAction("AAVE_WITHDRAW", msg.sender, amount, requestId);

        // For immediate response, simulate yield gains based on current APY
        // Backend will handle actual yield settlement asynchronously
        uint256 withdrawnAmount = (amount *
            (10000 + currentYields.aaveAPY / 365)) / 10000;
        return withdrawnAmount;
    }

    function _withdrawFromTraderJoe(
        uint256 amount
    ) internal view returns (uint256) {
        // Mock implementation for hackathon demo
        // In production, this would interact with TraderJoe's LP contracts
        // For demo purposes, we simulate withdrawal with potential yield gains
        uint256 withdrawnAmount = (amount *
            (10000 + currentYields.traderJoeAPY / 365)) / 10000;
        return withdrawnAmount;
    }

    function _withdrawFromYieldYak(
        uint256 amount
    ) internal view returns (uint256) {
        // Mock implementation for hackathon demo
        // In production, this would interact with YieldYak's strategy contracts
        // For demo purposes, we simulate withdrawal with potential yield gains
        uint256 withdrawnAmount = (amount *
            (10000 + currentYields.yieldYakAPY / 365)) / 10000;
        return withdrawnAmount;
    }

    function _calculateOptimalAllocation(
        uint256 totalAmount,
        uint8 riskScore
    )
        internal
        pure
        returns (uint256 aave, uint256 traderJoe, uint256 yieldYak)
    {
        if (riskScore <= 33) {
            aave = (totalAmount * 7000) / BASIS_POINTS;
            traderJoe = (totalAmount * 3000) / BASIS_POINTS;
            yieldYak = 0;
        } else if (riskScore <= 66) {
            aave = (totalAmount * 4000) / BASIS_POINTS;
            traderJoe = (totalAmount * 4000) / BASIS_POINTS;
            yieldYak = (totalAmount * 2000) / BASIS_POINTS;
        } else {
            aave = (totalAmount * 2000) / BASIS_POINTS;
            traderJoe = (totalAmount * 3000) / BASIS_POINTS;
            yieldYak = (totalAmount * 5000) / BASIS_POINTS;
        }
    }

    function _shouldRebalance(
        ProtocolAllocation memory current,
        uint256 targetAave,
        uint256 targetTraderJoe,
        uint256 targetYieldYak,
        uint256 totalValue
    ) internal pure returns (bool) {
        uint256 aaveDiff = current.aaveAmount > targetAave
            ? current.aaveAmount - targetAave
            : targetAave - current.aaveAmount;

        uint256 threshold = (totalValue * REBALANCE_THRESHOLD) / BASIS_POINTS;

        return aaveDiff > threshold;
    }

    function _executeRebalance(
        address user,
        ProtocolAllocation storage current,
        uint256 targetAave,
        uint256 targetTraderJoe,
        uint256 targetYieldYak
    ) internal {
        // Calculate differences between current and target allocations
        int256 aaveDiff = int256(targetAave) - int256(current.aaveAmount);
        int256 traderJoeDiff = int256(targetTraderJoe) -
            int256(current.traderJoeAmount);
        int256 yieldYakDiff = int256(targetYieldYak) -
            int256(current.yieldYakAmount);

        uint256 totalWithdrawn = 0;

        // Step 1: Withdraw from over-allocated protocols
        if (aaveDiff < 0) {
            uint256 withdrawAmount = uint256(-aaveDiff);
            totalWithdrawn += _withdrawFromAave(withdrawAmount);
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
        if (aaveDiff > 0) {
            _depositToAave(uint256(aaveDiff));
        }
        if (traderJoeDiff > 0) {
            _depositToTraderJoe(uint256(traderJoeDiff));
        }
        if (yieldYakDiff > 0) {
            _depositToYieldYak(uint256(yieldYakDiff));
        }

        // Update allocations to reflect new state
        current.aaveAmount = targetAave;
        current.traderJoeAmount = targetTraderJoe;
        current.yieldYakAmount = targetYieldYak;
    }

    // Owner functions
    function updateProtocolAddress(
        string calldata protocol,
        address newAddress
    ) external onlyOwner {
        require(newAddress != address(0), "Invalid address");

        bytes32 protocolHash = keccak256(abi.encodePacked(protocol));

        if (protocolHash == keccak256(abi.encodePacked("traderjoe"))) {
            traderJoeRouter = newAddress;
        } else if (
            protocolHash == keccak256(abi.encodePacked("traderjoe_pair"))
        ) {
            traderJoePair = newAddress;
        } else if (protocolHash == keccak256(abi.encodePacked("yieldyak"))) {
            yieldYakFarm = newAddress;
        } else if (protocolHash == keccak256(abi.encodePacked("wavax"))) {
            WAVAX = newAddress;
        } else if (protocolHash == keccak256(abi.encodePacked("usdc"))) {
            USDC = newAddress;
        } else {
            revert("Invalid protocol");
        }

        emit ProtocolAddressUpdated(protocol, newAddress);
    }

    /**
     * @dev Set token addresses for WAVAX and USDC
     * @param _wavax WAVAX token address
     * @param _usdc USDC token address
     */
    function setTokenAddresses(
        address _wavax,
        address _usdc
    ) external onlyOwner {
        require(_wavax != address(0), "Invalid WAVAX address");
        require(_usdc != address(0), "Invalid USDC address");

        WAVAX = _wavax;
        USDC = _usdc;

        emit ProtocolAddressUpdated("WAVAX", _wavax);
        emit ProtocolAddressUpdated("USDC", _usdc);
    }

    function updateYields(
        uint256 _aaveAPY,
        uint256 _traderJoeAPY,
        uint256 _yieldYakAPY
    ) external onlyOwner {
        currentYields.aaveAPY = _aaveAPY;
        currentYields.traderJoeAPY = _traderJoeAPY;
        currentYields.yieldYakAPY = _yieldYakAPY;
        currentYields.lastUpdated = block.timestamp;

        emit YieldsUpdated(_aaveAPY, _traderJoeAPY, _yieldYakAPY);
    }

    /**
     * @dev Get allocation ratio for TraderJoe LP based on risk score
     * Conservative: 30% AVAX, 70% USDC (lower volatility)
     * Balanced: 50% AVAX, 50% USDC (standard LP)
     * Aggressive: 70% AVAX, 30% USDC (higher upside potential)
     */
    function _getTraderJoeAllocationRatio(
        uint8 riskScore
    ) internal pure returns (uint256 avaxRatio, uint256 usdcRatio) {
        if (riskScore <= 33) {
            // Conservative: Lower AVAX exposure
            avaxRatio = 3000; // 30%
            usdcRatio = 7000; // 70%
        } else if (riskScore <= 66) {
            // Balanced: Standard LP allocation
            avaxRatio = 5000; // 50%
            usdcRatio = 5000; // 50%
        } else {
            // Aggressive: Higher AVAX exposure
            avaxRatio = 7000; // 70%
            usdcRatio = 3000; // 30%
        }
    }
}
