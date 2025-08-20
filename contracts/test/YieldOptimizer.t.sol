// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@forge-std/Test.sol";
import "@forge-std/console.sol";
import "../src/YieldOptimizer.sol";
import "../script/config/NetworkConfig.sol";

contract YieldOptimizerTest is Test {
    YieldOptimizer public optimizer;

    // Test accounts
    address public owner;
    address public user1;
    address public user2;
    address public user3;

    // Events to test
    event YieldOptimized(address indexed user, uint256 amount, uint8 riskScore);
    event Rebalanced(address indexed user, uint256 totalValue);
    event YieldsUpdated(
        uint256 benqiAPY,
        uint256 traderJoeAPY,
        uint256 yieldYakAPY
    );
    event Withdrawn(address indexed user, uint256 amount);
    event ProtocolAddressUpdated(string protocol, address newAddress);

    function setUp() public {
        // Set up test accounts
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        // Get test configuration
        NetworkConfig.Config memory config = NetworkConfig.getLocalConfig();

        // Deploy YieldOptimizer contract with test configuration
        optimizer = new YieldOptimizer(
            config.traderJoeRouter,
            config.aavePool,
            config.yieldYakFarm,
            config.wavax,
            config.usdc
        );

        // Fund test accounts with AVAX
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
    }

    // Test basic deployment and initialization
    function testDeployment() public view {
        // Check initial yields are set
        (
            uint256 benqiAPY,
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,
            uint256 lastUpdated
        ) = optimizer.getCurrentYields();

        assertEq(benqiAPY, 500); // 5% APY
        assertEq(traderJoeAPY, 800); // 8% APY
        assertEq(yieldYakAPY, 1200); // 12% APY
        assertGt(lastUpdated, 0); // Should have timestamp

        // Check constants
        assertEq(optimizer.MIN_DEPOSIT(), 0.01 ether);
        assertEq(optimizer.REBALANCE_THRESHOLD(), 500);
        assertEq(optimizer.BASIS_POINTS(), 10000);
    }

    // Test conservative risk profile (0-33)
    function testConservativeRiskProfile() public {
        uint8 riskScore = 25; // Conservative
        uint256 depositAmount = 1 ether;

        vm.startPrank(user1);

        // Expect YieldOptimized event
        vm.expectEmit(true, false, false, true);
        emit YieldOptimized(user1, depositAmount, riskScore);

        optimizer.optimizeYield{value: depositAmount}(riskScore);

        // Check user profile
        (
            uint8 storedRiskScore,
            uint256 totalDeposited,
            uint256 lastRebalance,
            bool autoRebalance
        ) = optimizer.userProfiles(user1);

        assertEq(storedRiskScore, riskScore);
        assertEq(totalDeposited, depositAmount);
        assertGt(lastRebalance, 0);
        assertEq(autoRebalance, false);

        // Check allocations (70% Benqi, 30% TraderJoe, 0% YieldYak)
        (
            uint256 aaveAmount,
            uint256 traderJoeAmount,
            uint256 yieldYakAmount
        ) = optimizer.userAllocations(user1);

        assertEq(aaveAmount, (depositAmount * 7000) / 10000); // 70%
        assertEq(traderJoeAmount, (depositAmount * 3000) / 10000); // 30%
        assertEq(yieldYakAmount, 0); // 0%

        vm.stopPrank();
    }

    // Test balanced risk profile (34-66)
    function testBalancedRiskProfile() public {
        uint8 riskScore = 50; // Balanced
        uint256 depositAmount = 2 ether;

        vm.startPrank(user2);

        optimizer.optimizeYield{value: depositAmount}(riskScore);

        // Check allocations (40% Benqi, 40% TraderJoe, 20% YieldYak)
        (
            uint256 aaveAmount,
            uint256 traderJoeAmount,
            uint256 yieldYakAmount
        ) = optimizer.userAllocations(user2);

        assertEq(aaveAmount, (depositAmount * 4000) / 10000); // 40%
        assertEq(traderJoeAmount, (depositAmount * 4000) / 10000); // 40%
        assertEq(yieldYakAmount, (depositAmount * 2000) / 10000); // 20%

        vm.stopPrank();
    }

    // Test aggressive risk profile (67-100)
    function testAggressiveRiskProfile() public {
        uint8 riskScore = 85; // Aggressive
        uint256 depositAmount = 3 ether;

        vm.startPrank(user3);

        optimizer.optimizeYield{value: depositAmount}(riskScore);

        // Check allocations (20% Benqi, 30% TraderJoe, 50% YieldYak)
        (
            uint256 aaveAmount,
            uint256 traderJoeAmount,
            uint256 yieldYakAmount
        ) = optimizer.userAllocations(user3);

        assertEq(aaveAmount, (depositAmount * 2000) / 10000); // 20%
        assertEq(traderJoeAmount, (depositAmount * 3000) / 10000); // 30%
        assertEq(yieldYakAmount, (depositAmount * 5000) / 10000); // 50%

        vm.stopPrank();
    }

    // Test multiple deposits accumulation
    function testMultipleDeposits() public {
        uint8 riskScore = 50;
        uint256 firstDeposit = 1 ether;
        uint256 secondDeposit = 0.5 ether;
        uint256 expectedTotal = firstDeposit + secondDeposit;

        vm.startPrank(user1);

        // First deposit
        optimizer.optimizeYield{value: firstDeposit}(riskScore);

        // Second deposit
        optimizer.optimizeYield{value: secondDeposit}(riskScore);

        // Check total deposited
        (, uint256 totalDeposited, , ) = optimizer.userProfiles(user1);
        assertEq(totalDeposited, expectedTotal);

        // Check accumulated allocations
        (
            uint256 aaveAmount,
            uint256 traderJoeAmount,
            uint256 yieldYakAmount
        ) = optimizer.userAllocations(user1);

        assertEq(aaveAmount, (expectedTotal * 4000) / 10000); // 40%
        assertEq(traderJoeAmount, (expectedTotal * 4000) / 10000); // 40%
        assertEq(yieldYakAmount, (expectedTotal * 2000) / 10000); // 20%

        vm.stopPrank();
    }

    // Test edge cases for risk scores
    function testRiskScoreEdgeCases() public {
        vm.startPrank(user1);

        // Test risk score 33 (boundary for conservative)
        optimizer.optimizeYield{value: 1 ether}(33);
        (uint256 benqi1, , ) = optimizer.userAllocations(user1);
        assertEq(benqi1, 0.7 ether); // Should be conservative (70%)

        // Reset for next test
        optimizer.emergencyWithdraw();

        // Test risk score 34 (boundary for balanced)
        optimizer.optimizeYield{value: 1 ether}(34);
        (uint256 benqi2, , ) = optimizer.userAllocations(user1);
        assertEq(benqi2, 0.4 ether); // Should be balanced (40%)

        // Reset for next test
        optimizer.emergencyWithdraw();

        // Test risk score 66 (boundary for balanced)
        optimizer.optimizeYield{value: 1 ether}(66);
        (uint256 benqi3, , ) = optimizer.userAllocations(user1);
        assertEq(benqi3, 0.4 ether); // Should be balanced (40%)

        // Reset for next test
        optimizer.emergencyWithdraw();

        // Test risk score 67 (boundary for aggressive)
        optimizer.optimizeYield{value: 1 ether}(67);
        (uint256 benqi4, , ) = optimizer.userAllocations(user1);
        assertEq(benqi4, 0.2 ether); // Should be aggressive (20%)

        vm.stopPrank();
    }

    // Test getUserPortfolio function
    function testGetUserPortfolio() public {
        uint8 riskScore = 50;
        uint256 depositAmount = 2 ether;

        vm.startPrank(user1);
        optimizer.optimizeYield{value: depositAmount}(riskScore);
        vm.stopPrank();

        // Get portfolio information
        (
            YieldOptimizer.UserProfile memory profile,
            YieldOptimizer.ProtocolAllocation memory allocation,
            uint256 estimatedValue
        ) = optimizer.getUserPortfolio(user1);

        // Check profile data
        assertEq(profile.riskScore, riskScore);
        assertEq(profile.totalDeposited, depositAmount);
        assertGt(profile.lastRebalance, 0);
        assertEq(profile.autoRebalance, false);

        // Check allocation data
        assertEq(allocation.aaveAmount, (depositAmount * 4000) / 10000);
        assertEq(allocation.traderJoeAmount, (depositAmount * 4000) / 10000);
        assertEq(allocation.yieldYakAmount, (depositAmount * 2000) / 10000);

        // Check estimated value
        assertEq(estimatedValue, depositAmount);
    }

    // Test rebalance recommendation
    function testRebalanceRecommendation() public {
        uint8 riskScore = 50;
        uint256 depositAmount = 1 ether;

        vm.startPrank(user1);
        optimizer.optimizeYield{value: depositAmount}(riskScore);
        vm.stopPrank();

        // Get rebalance recommendation (should not need rebalancing immediately)
        (
            bool shouldRebalance,
            uint256 newBenqiAllocation,
            uint256 newTraderJoeAllocation,
            uint256 newYieldYakAllocation
        ) = optimizer.getRebalanceRecommendation(user1);

        // Should not need rebalancing right after deposit
        assertEq(shouldRebalance, false);

        // Check recommended allocations match current strategy
        assertEq(newBenqiAllocation, (depositAmount * 4000) / 10000);
        assertEq(newTraderJoeAllocation, (depositAmount * 4000) / 10000);
        assertEq(newYieldYakAllocation, (depositAmount * 2000) / 10000);
    }

    // Test emergency withdraw
    function testEmergencyWithdraw() public {
        uint256 depositAmount = 2 ether;
        uint256 initialBalance = user1.balance;

        vm.startPrank(user1);

        // Make deposit
        optimizer.optimizeYield{value: depositAmount}(50);

        // Expect Withdrawn event
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(user1, depositAmount);

        // Execute emergency withdrawal
        optimizer.emergencyWithdraw();

        // Check user profile is reset
        (, uint256 totalDeposited, , ) = optimizer.userProfiles(user1);
        assertEq(totalDeposited, 0);

        // Check allocations are reset
        (
            uint256 aaveAmount,
            uint256 traderJoeAmount,
            uint256 yieldYakAmount
        ) = optimizer.userAllocations(user1);
        assertEq(aaveAmount, 0);
        assertEq(traderJoeAmount, 0);
        assertEq(yieldYakAmount, 0);

        // Check user received their funds back
        assertEq(user1.balance, initialBalance);

        vm.stopPrank();
    }

    // Test yield updates (owner only)
    function testYieldUpdates() public {
        uint256 newBenqiAPY = 600; // 6%
        uint256 newTraderJoeAPY = 900; // 9%
        uint256 newYieldYakAPY = 1400; // 14%

        // Expect YieldsUpdated event
        vm.expectEmit(false, false, false, true);
        emit YieldsUpdated(newBenqiAPY, newTraderJoeAPY, newYieldYakAPY);

        optimizer.updateYields(newBenqiAPY, newTraderJoeAPY, newYieldYakAPY);

        // Check yields were updated
        (
            uint256 benqiAPY,
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,
            uint256 lastUpdated
        ) = optimizer.getCurrentYields();

        assertEq(benqiAPY, newBenqiAPY);
        assertEq(traderJoeAPY, newTraderJoeAPY);
        assertEq(yieldYakAPY, newYieldYakAPY);
        assertEq(lastUpdated, block.timestamp);
    }

    // Test protocol address updates (owner only)
    function testProtocolAddressUpdates() public {
        address newTraderJoeAddress = makeAddr("newTraderJoe");

        // Expect ProtocolAddressUpdated event
        vm.expectEmit(false, false, false, true);
        emit ProtocolAddressUpdated("traderjoe", newTraderJoeAddress);

        optimizer.updateProtocolAddress("traderjoe", newTraderJoeAddress);

        // Check address was updated
        assertEq(optimizer.traderJoeRouter(), newTraderJoeAddress);
    }

    // Test access control - only owner can update yields
    function testYieldUpdateAccessControl() public {
        vm.startPrank(user1);

        vm.expectRevert();
        optimizer.updateYields(600, 900, 1400);

        vm.stopPrank();
    }

    // Test access control - only owner can update protocol addresses
    function testProtocolAddressUpdateAccessControl() public {
        vm.startPrank(user1);

        vm.expectRevert();
        optimizer.updateProtocolAddress("traderjoe", makeAddr("newAddress"));

        vm.stopPrank();
    }

    // Test invalid risk score
    function testInvalidRiskScore() public {
        vm.startPrank(user1);

        vm.expectRevert("Invalid risk score");
        optimizer.optimizeYield{value: 1 ether}(101);

        vm.stopPrank();
    }

    // Test minimum deposit requirement
    function testMinimumDepositRequirement() public {
        vm.startPrank(user1);

        vm.expectRevert("Deposit too small");
        optimizer.optimizeYield{value: 0.005 ether}(50);

        vm.stopPrank();
    }

    // Test rebalance function
    function testRebalanceFunction() public {
        uint256 depositAmount = 2 ether;

        vm.startPrank(user1);

        // Make initial deposit
        optimizer.optimizeYield{value: depositAmount}(50);

        // Expect Rebalanced event
        vm.expectEmit(true, false, false, true);
        emit Rebalanced(user1, depositAmount);

        // Execute rebalance
        optimizer.rebalance();

        // Check that last rebalance timestamp was updated
        (, , uint256 lastRebalance, ) = optimizer.userProfiles(user1);
        assertEq(lastRebalance, block.timestamp);

        vm.stopPrank();
    }

    // Test rebalance with no deposits
    function testRebalanceWithNoDeposits() public {
        vm.startPrank(user1);

        vm.expectRevert("No deposits to rebalance");
        optimizer.rebalance();

        vm.stopPrank();
    }

    // Test invalid protocol name in address update
    function testInvalidProtocolNameUpdate() public {
        vm.expectRevert("Invalid protocol");
        optimizer.updateProtocolAddress(
            "invalidprotocol",
            makeAddr("someAddress")
        );
    }

    // Gas optimization test
    function testGasUsage() public {
        vm.startPrank(user1);

        uint256 gasBefore = gasleft();
        optimizer.optimizeYield{value: 1 ether}(50);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for optimizeYield:", gasUsed);

        // Ensure gas usage is reasonable (less than 200k gas)
        assertLt(gasUsed, 200_000);

        vm.stopPrank();
    }

    // Fuzz test for risk scores
    function testFuzzRiskScores(uint8 riskScore) public {
        // Bound risk score to valid range
        riskScore = uint8(bound(riskScore, 0, 100));

        vm.startPrank(user1);

        optimizer.optimizeYield{value: 1 ether}(riskScore);

        // Check that user profile was created
        (uint8 storedRiskScore, , , ) = optimizer.userProfiles(user1);
        assertEq(storedRiskScore, riskScore);

        // Check that allocations are correct based on risk score
        (
            uint256 aaveAmount,
            uint256 traderJoeAmount,
            uint256 yieldYakAmount
        ) = optimizer.userAllocations(user1);

        // Total should equal deposit
        assertEq(aaveAmount + traderJoeAmount + yieldYakAmount, 1 ether);

        vm.stopPrank();

        // Clean up for next iteration
        vm.startPrank(user1);
        optimizer.emergencyWithdraw();
        vm.stopPrank();
    }

    // Test contract receives ETH properly
    function testReceiveETH() public {
        uint256 contractBalanceBefore = address(optimizer).balance;

        vm.startPrank(user1);
        optimizer.optimizeYield{value: 1 ether}(50);
        vm.stopPrank();

        // Contract should have received the ETH
        assertEq(address(optimizer).balance, contractBalanceBefore + 1 ether);
    }
}
