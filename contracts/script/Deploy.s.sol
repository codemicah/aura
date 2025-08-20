// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {YieldOptimizer} from "../src/YieldOptimizer.sol";
import {NetworkConfig} from "./config/NetworkConfig.sol";

/**
 * @title DeployScript
 * @dev Deployment script for YieldOptimizer contract
 * @notice This script deploys the YieldOptimizer contract and sets up initial configuration
 */
contract DeployScript is Script {
    // Initial yield rates (basis points)
    uint256 constant INITIAL_AAVE_APY = 500; // 5% - Changed from INITIAL_BENQI_APY
    uint256 constant INITIAL_TRADERJOE_APY = 800; // 8%
    uint256 constant INITIAL_YIELDYAK_APY = 1200; // 12%

    YieldOptimizer public yieldOptimizer;

    function run() external returns (YieldOptimizer) {
        // Get network-specific configuration
        NetworkConfig.Config memory config = getNetworkConfig();

        // Deploy the contract
        vm.startBroadcast();

        console.log("Deploying YieldOptimizer with configuration:");
        console.log("- TraderJoe Router:", config.traderJoeRouter);
        console.log("- Aave V3 Pool:", config.aavePool); // Changed from benqiComptroller
        console.log("- YieldYak Farm:", config.yieldYakFarm);
        console.log("- WAVAX:", config.wavax);
        console.log("- USDC:", config.usdc);

        yieldOptimizer = new YieldOptimizer(
            config.traderJoeRouter,
            config.aavePool, // Changed from benqiComptroller
            config.yieldYakFarm,
            config.wavax,
            config.usdc
        );

        console.log("YieldOptimizer deployed at:", address(yieldOptimizer));

        // Set TraderJoe pair if needed (can be set later via updateProtocolAddress)
        if (config.traderJoeRouter != address(0)) {
            console.log("TraderJoe router configured, pair can be set later");
        }

        // Set initial yield rates
        yieldOptimizer.updateYields(
            INITIAL_AAVE_APY, // Changed from INITIAL_BENQI_APY
            INITIAL_TRADERJOE_APY,
            INITIAL_YIELDYAK_APY
        );

        console.log("Initial yields configured:");
        console.log("- Aave APY:", INITIAL_AAVE_APY, "basis points"); // Changed from Benqi
        console.log("- TraderJoe APY:", INITIAL_TRADERJOE_APY, "basis points");
        console.log("- YieldYak APY:", INITIAL_YIELDYAK_APY, "basis points");

        // Verify deployment
        _verifyDeployment();

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("YieldOptimizer:", address(yieldOptimizer));
        console.log("Owner:", yieldOptimizer.owner());
        console.log("TraderJoe Router:", yieldOptimizer.traderJoeRouter());
        console.log("Aave Pool:", yieldOptimizer.aavePool()); // Updated to use new function name
        console.log("YieldYak Farm:", yieldOptimizer.yieldYakFarm());

        (
            uint256 aaveAPY, // Changed from benqiAPY
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,

        ) = yieldOptimizer.getCurrentYields();
        console.log("Current Yields:");
        console.log("- Aave APY:", aaveAPY); // Changed from benqiAPY
        console.log("- TraderJoe APY:", traderJoeAPY);
        console.log("- YieldYak APY:", yieldYakAPY);

        console.log("\n=== Next Steps ===");
        console.log(
            "1. Update frontend with contract address:",
            address(yieldOptimizer)
        );
        console.log("2. Update backend with contract address and ABI");
        console.log("3. Test with small deposits on testnet first");
        console.log("4. Consider setting up automated yield updates");

        return yieldOptimizer;
    }

    /**
     * @dev Get network-specific configuration based on chain ID
     */
    function getNetworkConfig()
        internal
        view
        returns (NetworkConfig.Config memory)
    {
        uint256 chainId = block.chainid;
        console.log("Chain ID:", chainId);

        if (chainId == 43114) {
            console.log("Using Avalanche Mainnet configuration");
            return NetworkConfig.getMainnetConfig();
        } else if (chainId == 43113) {
            console.log("Using Avalanche Fuji Testnet configuration");
            return NetworkConfig.getFujiConfig();
        } else {
            // Localhost - check if user specified fork mode
            bool isFork = vm.envOr("IS_FORK", false);

            if (isFork) {
                console.log("Fork mode enabled - using testnet addresses");
                return NetworkConfig.getForkConfig();
            } else {
                console.log("Local mode - using mock addresses");
                return NetworkConfig.getLocalConfig();
            }
        }
    }

    function _verifyDeployment() internal view {
        // Verify contract was deployed correctly
        require(
            address(yieldOptimizer) != address(0),
            "YieldOptimizer deployment failed"
        );

        // Verify initial configuration
        require(yieldOptimizer.owner() != address(0), "Owner not set");
        require(
            yieldOptimizer.traderJoeRouter() != address(0),
            "TraderJoe router not set"
        );
        require(yieldOptimizer.aavePool() != address(0), "Aave pool not set");
        require(
            yieldOptimizer.yieldYakFarm() != address(0),
            "YieldYak farm not set"
        );

        // Verify yields are set
        (
            uint256 benqiAPY,
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,
            uint256 lastUpdated
        ) = yieldOptimizer.getCurrentYields();
        require(benqiAPY > 0, "Benqi APY not set");
        require(traderJoeAPY > 0, "TraderJoe APY not set");
        require(yieldYakAPY > 0, "YieldYak APY not set");
        require(lastUpdated > 0, "Yields timestamp not set");

        // Verify constants
        require(
            yieldOptimizer.MIN_DEPOSIT() == 0.01 ether,
            "MIN_DEPOSIT incorrect"
        );
        require(
            yieldOptimizer.REBALANCE_THRESHOLD() == 500,
            "REBALANCE_THRESHOLD incorrect"
        );
        require(
            yieldOptimizer.BASIS_POINTS() == 10000,
            "BASIS_POINTS incorrect"
        );

        console.log("Deployment verification completed successfully");
    }

    // Create deterministic addresses for testing (override forge-std version)
    function makeAddr(
        string memory name
    ) internal pure override returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(name)))));
    }
}
