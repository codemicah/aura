// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/YieldOptimizer.sol";

contract YieldOptimizerTest is Test {
    YieldOptimizer public yieldOptimizer;
    address public constant ALICE = address(0x1);

    function setUp() public {
        // Create mock addresses for testing
        address mockTraderJoe = address(0x2);
        address mockAave = address(0x3);
        address mockYieldYak = address(0x4);
        address mockWAVAX = address(0x5);
        address mockUSDC = address(0x6);

        yieldOptimizer = new YieldOptimizer(
            mockTraderJoe,
            mockAave,
            mockYieldYak,
            mockWAVAX,
            mockUSDC
        );

        // Set up TraderJoe pair address for testing
        yieldOptimizer.updateProtocolAddress("traderjoe_pair", address(0x7));
    }

    function testYieldOptimization() public {
        // Test successful yield optimization with mock vault
        vm.deal(ALICE, 1 ether);
        vm.startPrank(ALICE);

        // This should work now with the mock vault
        yieldOptimizer.optimizeYield{value: 1 ether}(50);

        // Check that user profile was updated
        (YieldOptimizer.UserProfile memory profile, , ) = yieldOptimizer
            .getUserPortfolio(ALICE);
        assertEq(profile.totalDeposited, 1 ether);
        assertEq(profile.riskScore, 50);

        vm.stopPrank();
    }

    function testUserProfileTracking() public {
        vm.deal(ALICE, 1 ether);
        vm.startPrank(ALICE);

        // Check initial state
        (YieldOptimizer.UserProfile memory profile, , ) = yieldOptimizer
            .getUserPortfolio(ALICE);
        assertEq(profile.totalDeposited, 0);
        assertEq(profile.riskScore, 0);

        // Make a deposit
        yieldOptimizer.optimizeYield{value: 0.5 ether}(75);

        // Check updated state
        (profile, , ) = yieldOptimizer.getUserPortfolio(ALICE);
        assertEq(profile.totalDeposited, 0.5 ether);
        assertEq(profile.riskScore, 75);

        vm.stopPrank();
    }

    function testYieldRetrieval() public {
        (
            uint256 benqiAPY,
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,
            uint256 lastUpdated
        ) = yieldOptimizer.getCurrentYields();

        assertEq(benqiAPY, 500); // 5%
        assertEq(traderJoeAPY, 800); // 8%
        assertEq(yieldYakAPY, 1200); // 12%
        assertGt(lastUpdated, 0);
    }

    function testMinDeposit() public {
        vm.expectRevert("Deposit too small");
        yieldOptimizer.optimizeYield{value: 0.005 ether}(50);
    }

    function testInvalidRiskScore() public {
        vm.expectRevert("Invalid risk score");
        yieldOptimizer.optimizeYield{value: 1 ether}(101);
    }
}
