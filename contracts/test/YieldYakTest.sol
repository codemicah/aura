// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@forge-std/Test.sol";
import "../src/YieldOptimizer.sol";

contract YieldYakTest is Test {
    YieldOptimizer public optimizer;
    address public owner;
    address public user1;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");

        // Deploy with mock addresses
        optimizer = new YieldOptimizer(
            address(0x1), // traderJoeRouter
            address(0x3), // yieldYakFarm
            address(0x4), // WAVAX
            address(0x5) // USDC
        );

        // Set trader joe pair to avoid revert
        optimizer.updateProtocolAddress("traderjoe_pair", address(0x6));

        vm.deal(user1, 100 ether);
    }

    function testYieldYakDeposit() public {
        // Test aggressive risk profile (67-100) which allocates 50% to YieldYak
        uint8 riskScore = 80; // Aggressive
        uint256 depositAmount = 1 ether;

        vm.startPrank(user1);

        // This should succeed for YieldYak allocation without external calls
        optimizer.optimizeYield{value: depositAmount}(riskScore);

        // Check allocations - Aggressive: 20% Aave, 30% TraderJoe, 50% YieldYak
        (
            uint256 aaveAmount,
            uint256 traderJoeAmount,
            uint256 yieldYakAmount
        ) = optimizer.userAllocations(user1);

        assertEq(aaveAmount, (depositAmount * 2000) / 10000); // 20%
        assertEq(traderJoeAmount, (depositAmount * 3000) / 10000); // 30%
        assertEq(yieldYakAmount, (depositAmount * 5000) / 10000); // 50%

        vm.stopPrank();
    }

    function testYieldYakDepositZeroAllocation() public {
        // Test conservative risk profile (0-33) which allocates 0% to YieldYak
        uint8 riskScore = 25; // Conservative
        uint256 depositAmount = 1 ether;

        vm.startPrank(user1);

        optimizer.optimizeYield{value: depositAmount}(riskScore);

        // Check allocations - Conservative: 70% Aave, 30% TraderJoe, 0% YieldYak
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
}
