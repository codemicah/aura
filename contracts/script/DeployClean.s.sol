// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {YieldOptimizer} from "../src/YieldOptimizer.sol";
import {NetworkConfig} from "./config/NetworkConfig.sol";

/**
 * @title DeployScript
 * @dev Industry standard deployment script for YieldOptimizer contract
 * @notice This script deploys the YieldOptimizer contract with environment-based configuration
 *
 * Usage:
 * - Local: make deploy-local
 * - Fuji: PRIVATE_KEY=0x... make deploy-fuji
 * - Mainnet: PRIVATE_KEY=0x... make deploy-mainnet
 */
contract DeployScript is Script {
    // Initial yield rates (basis points)
    uint256 constant INITIAL_AAVE_APY = 500; // 5%
    uint256 constant INITIAL_TRADERJOE_APY = 800; // 8%
    uint256 constant INITIAL_YIELDYAK_APY = 1200; // 12%

    // Default Anvil private key (for local development only)
    uint256 constant DEFAULT_ANVIL_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    YieldOptimizer public yieldOptimizer;

    function run() external returns (YieldOptimizer) {
        // Get network configuration
        NetworkConfig.Config memory config = getNetworkConfig();

        // Get deployer private key based on environment
        uint256 deployerPrivateKey = getDeployerPrivateKey();
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deployment Configuration ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");

        _logNetworkConfig(config);

        // Deploy the contract
        vm.startBroadcast(deployerPrivateKey);

        yieldOptimizer = new YieldOptimizer(
            config.traderJoeRouter,
            config.yieldYakFarm,
            config.wavax,
            config.usdc
        );

        console.log("YieldOptimizer deployed at:", address(yieldOptimizer));

        // Set initial yield rates
        yieldOptimizer.updateYields(
            INITIAL_AAVE_APY,
            INITIAL_TRADERJOE_APY,
            INITIAL_YIELDYAK_APY
        );

        console.log("Initial yields configured");

        vm.stopBroadcast();

        // Verify deployment
        _verifyDeployment(config);

        _printDeploymentSummary();

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

        if (chainId == 43114) {
            console.log("Network: Avalanche Mainnet");
            return NetworkConfig.getMainnetConfig();
        } else if (chainId == 43113) {
            console.log("Network: Avalanche Fuji Testnet");
            return NetworkConfig.getFujiConfig();
        } else if (chainId == 31337) {
            // Local Anvil - check for fork mode
            if (_isForkedNetwork()) {
                console.log("Network: Local Fork (Fuji)");
                return NetworkConfig.getFujiConfig();
            } else {
                console.log("Network: Local Development");
                console.log(
                    "WARNING: Using mock addresses - for testing only!"
                );
                return NetworkConfig.getLocalConfig();
            }
        } else {
            revert("Unsupported network");
        }
    }

    /**
     * @dev Get deployer private key based on environment
     */
    function getDeployerPrivateKey() internal view returns (uint256) {
        uint256 chainId = block.chainid;

        if (chainId == 31337) {
            // Local Anvil - use default key unless PRIVATE_KEY is provided
            uint256 providedKey = vm.envOr("PRIVATE_KEY", uint256(0));
            if (providedKey != 0) {
                console.log("Using provided PRIVATE_KEY for local deployment");
                return providedKey;
            }
            console.log("Using default Anvil private key");
            return DEFAULT_ANVIL_KEY;
        } else {
            // Live networks - require PRIVATE_KEY
            uint256 privateKey = vm.envOr("PRIVATE_KEY", uint256(0));
            require(
                privateKey != 0,
                "PRIVATE_KEY environment variable required for live networks"
            );
            require(
                privateKey != DEFAULT_ANVIL_KEY,
                "Cannot use default Anvil key for live networks"
            );
            console.log("Using provided PRIVATE_KEY for live deployment");
            return privateKey;
        }
    }

    /**
     * @dev Check if we're running on a forked network
     */
    function _isForkedNetwork() internal view returns (bool) {
        // Check IS_FORK environment variable
        if (vm.envOr("IS_FORK", false)) {
            return true;
        }

        // Auto-detect by checking if real protocol contracts exist
        address fujiWAVAX = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
        return fujiWAVAX.code.length > 0;
    }

    /**
     * @dev Log network configuration
     */
    function _logNetworkConfig(
        NetworkConfig.Config memory config
    ) internal pure {
        console.log("=== Protocol Addresses ===");
        console.log("TraderJoe Router:", config.traderJoeRouter);
        console.log("YieldYak Farm:", config.yieldYakFarm);
        console.log("WAVAX:", config.wavax);
        console.log("USDC:", config.usdc);
    }

    /**
     * @dev Verify deployment succeeded
     */
    function _verifyDeployment(
        NetworkConfig.Config memory config
    ) internal view {
        require(
            address(yieldOptimizer) != address(0),
            "YieldOptimizer deployment failed"
        );
        require(
            yieldOptimizer.owner() == vm.addr(getDeployerPrivateKey()),
            "Owner not set correctly"
        );

        // Verify protocol addresses
        require(
            yieldOptimizer.traderJoeRouter() == config.traderJoeRouter,
            "TraderJoe router mismatch"
        );
        require(
            yieldOptimizer.yieldYakFarm() == config.yieldYakFarm,
            "YieldYak farm mismatch"
        );

        // Check if protocol addresses have code (for fork/live networks)
        if (block.chainid != 31337 || _isForkedNetwork()) {
            if (config.traderJoeRouter.code.length == 0) {
                console.log("WARNING: TraderJoe router has no code!");
            }
            if (config.yieldYakFarm.code.length == 0) {
                console.log("WARNING: YieldYak farm has no code!");
            }
        }

        // Verify yields were set
        (
            uint256 aaveAPY,
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,

        ) = yieldOptimizer.getCurrentYields();
        require(aaveAPY == INITIAL_AAVE_APY, "Aave APY not set correctly");
        require(
            traderJoeAPY == INITIAL_TRADERJOE_APY,
            "TraderJoe APY not set correctly"
        );
        require(
            yieldYakAPY == INITIAL_YIELDYAK_APY,
            "YieldYak APY not set correctly"
        );

        console.log("Deployment verification completed successfully");
    }

    /**
     * @dev Print deployment summary
     */
    function _printDeploymentSummary() internal view {
        console.log("\n=== Deployment Summary ===");
        console.log("YieldOptimizer:", address(yieldOptimizer));
        console.log("Owner:", yieldOptimizer.owner());

        (
            uint256 aaveAPY,
            uint256 traderJoeAPY,
            uint256 yieldYakAPY,

        ) = yieldOptimizer.getCurrentYields();
        console.log("Initial Yields:");
        console.log("- Aave APY:", aaveAPY, "bp");
        console.log("- TraderJoe APY:", traderJoeAPY, "bp");
        console.log("- YieldYak APY:", yieldYakAPY, "bp");

        console.log("\n=== Next Steps ===");
        console.log("1. Update frontend with contract address");
        console.log("2. Update backend with contract address and ABI");
        console.log("3. Test with small deposits first");
        console.log("4. Set up automated yield updates");
    }
}
