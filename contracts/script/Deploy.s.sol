// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@forge-std/Script.sol";
import "@forge-std/console.sol";
import "../src/YieldOptimizer.sol";

/**
 * @title DeployScript
 * @dev Deployment script for YieldOptimizer contract
 * @notice This script deploys the YieldOptimizer contract and sets up initial configuration
 */
contract DeployScript is Script {
    // Avalanche Mainnet Protocol Addresses
    address constant AVALANCHE_TRADERJOE_ROUTER = 0x60aE616a2155Ee3d9A68541Ba4544862310933d4;
    address constant AVALANCHE_BENQI_COMPTROLLER = 0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4;
    address constant AVALANCHE_YIELDYAK_FARM = 0xC4729E56b831d74bBc18797e0e17A295fA77488c;
    
    // Avalanche Fuji Testnet Protocol Addresses (for testing)
    address constant FUJI_TRADERJOE_ROUTER = 0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901;
    address constant FUJI_BENQI_COMPTROLLER = 0xe194c4c5aC32a3C9ffDb358d9Bfd523a0B6d1568;
    address constant FUJI_YIELDYAK_FARM = 0x0000000000000000000000000000000000000000; // Mock address for testing

    // Initial yield rates (basis points)
    uint256 constant INITIAL_BENQI_APY = 500;    // 5%
    uint256 constant INITIAL_TRADERJOE_APY = 800; // 8%
    uint256 constant INITIAL_YIELDYAK_APY = 1200; // 12%

    YieldOptimizer public yieldOptimizer;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying YieldOptimizer with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance / 1 ether, "AVAX");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy YieldOptimizer contract
        yieldOptimizer = new YieldOptimizer();
        console.log("YieldOptimizer deployed at:", address(yieldOptimizer));

        // Determine which network we're on and set appropriate protocol addresses
        uint256 chainId = block.chainid;
        console.log("Chain ID:", chainId);

        if (chainId == 43114) {
            // Avalanche Mainnet
            console.log("Configuring for Avalanche Mainnet...");
            _configureMainnet();
        } else if (chainId == 43113) {
            // Avalanche Fuji Testnet
            console.log("Configuring for Avalanche Fuji Testnet...");
            _configureFuji();
        } else {
            // Local/Other network - use mock addresses
            console.log("Configuring for local/test network...");
            _configureLocal();
        }

        // Set initial yield rates
        yieldOptimizer.updateYields(
            INITIAL_BENQI_APY,
            INITIAL_TRADERJOE_APY, 
            INITIAL_YIELDYAK_APY
        );

        console.log("Initial yields configured:");
        console.log("- Benqi APY:", INITIAL_BENQI_APY, "basis points");
        console.log("- TraderJoe APY:", INITIAL_TRADERJOE_APY, "basis points");
        console.log("- YieldYak APY:", INITIAL_YIELDYAK_APY, "basis points");

        // Verify deployment
        _verifyDeployment();

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("YieldOptimizer:", address(yieldOptimizer));
        console.log("Owner:", yieldOptimizer.owner());
        console.log("TraderJoe Router:", yieldOptimizer.traderJoeRouter());
        console.log("Benqi Comptroller:", yieldOptimizer.benqiComptroller());
        console.log("YieldYak Farm:", yieldOptimizer.yieldYakFarm());
        
        (uint256 benqiAPY, uint256 traderJoeAPY, uint256 yieldYakAPY,) = yieldOptimizer.getCurrentYields();
        console.log("Current Yields:");
        console.log("- Benqi APY:", benqiAPY);
        console.log("- TraderJoe APY:", traderJoeAPY);
        console.log("- YieldYak APY:", yieldYakAPY);
        
        console.log("\n=== Next Steps ===");
        console.log("1. Update frontend with contract address:", address(yieldOptimizer));
        console.log("2. Update backend with contract address and ABI");
        console.log("3. Test with small deposits on testnet first");
        console.log("4. Consider setting up automated yield updates");
    }

    function _configureMainnet() internal {
        yieldOptimizer.updateProtocolAddress("traderjoe", AVALANCHE_TRADERJOE_ROUTER);
        yieldOptimizer.updateProtocolAddress("benqi", AVALANCHE_BENQI_COMPTROLLER);
        yieldOptimizer.updateProtocolAddress("yieldyak", AVALANCHE_YIELDYAK_FARM);
        
        console.log("Mainnet protocol addresses configured:");
        console.log("- TraderJoe Router:", AVALANCHE_TRADERJOE_ROUTER);
        console.log("- Benqi Comptroller:", AVALANCHE_BENQI_COMPTROLLER);
        console.log("- YieldYak Farm:", AVALANCHE_YIELDYAK_FARM);
    }

    function _configureFuji() internal {
        yieldOptimizer.updateProtocolAddress("traderjoe", FUJI_TRADERJOE_ROUTER);
        yieldOptimizer.updateProtocolAddress("benqi", FUJI_BENQI_COMPTROLLER);
        yieldOptimizer.updateProtocolAddress("yieldyak", FUJI_YIELDYAK_FARM);
        
        console.log("Fuji testnet protocol addresses configured:");
        console.log("- TraderJoe Router:", FUJI_TRADERJOE_ROUTER);
        console.log("- Benqi Comptroller:", FUJI_BENQI_COMPTROLLER);
        console.log("- YieldYak Farm:", FUJI_YIELDYAK_FARM);
    }

    function _configureLocal() internal {
        // Create mock addresses for local testing
        address mockTraderJoe = makeAddr("mockTraderJoe");
        address mockBenqi = makeAddr("mockBenqi");
        address mockYieldYak = makeAddr("mockYieldYak");
        
        yieldOptimizer.updateProtocolAddress("traderjoe", mockTraderJoe);
        yieldOptimizer.updateProtocolAddress("benqi", mockBenqi);
        yieldOptimizer.updateProtocolAddress("yieldyak", mockYieldYak);
        
        console.log("Local/test protocol addresses configured:");
        console.log("- TraderJoe Router:", mockTraderJoe);
        console.log("- Benqi Comptroller:", mockBenqi);
        console.log("- YieldYak Farm:", mockYieldYak);
    }

    function _verifyDeployment() internal view {
        // Verify contract was deployed correctly
        require(address(yieldOptimizer) != address(0), "YieldOptimizer deployment failed");
        
        // Verify initial configuration
        require(yieldOptimizer.owner() != address(0), "Owner not set");
        require(yieldOptimizer.traderJoeRouter() != address(0), "TraderJoe router not set");
        require(yieldOptimizer.benqiComptroller() != address(0), "Benqi comptroller not set");
        require(yieldOptimizer.yieldYakFarm() != address(0), "YieldYak farm not set");
        
        // Verify yields are set
        (uint256 benqiAPY, uint256 traderJoeAPY, uint256 yieldYakAPY, uint256 lastUpdated) = 
            yieldOptimizer.getCurrentYields();
        require(benqiAPY > 0, "Benqi APY not set");
        require(traderJoeAPY > 0, "TraderJoe APY not set");
        require(yieldYakAPY > 0, "YieldYak APY not set");
        require(lastUpdated > 0, "Yields timestamp not set");
        
        // Verify constants
        require(yieldOptimizer.MIN_DEPOSIT() == 0.01 ether, "MIN_DEPOSIT incorrect");
        require(yieldOptimizer.REBALANCE_THRESHOLD() == 500, "REBALANCE_THRESHOLD incorrect");
        require(yieldOptimizer.BASIS_POINTS() == 10000, "BASIS_POINTS incorrect");
        
        console.log("Deployment verification completed successfully");
    }

    // Create deterministic addresses for testing (override forge-std version)
    function makeAddr(string memory name) internal pure override returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(name)))));
    }
}