// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title NetworkConfig
 * @dev Network-specific configuration for protocol addresses
 * @notice This library provides addresses for different networks (mainnet, testnet, local)
 */
library NetworkConfig {
    struct Config {
        address traderJoeRouter;
        address yieldYakFarm;
        address wavax;
        address usdc;
    }

    /**
     * @dev Get Avalanche Fuji Testnet configuration with REAL addresses
     */
    function getFujiConfig() internal pure returns (Config memory) {
        return
            Config({
                traderJoeRouter: 0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901, // Real TraderJoe Router ✅
                yieldYakFarm: 0x1DAff3C889Aff2f0b0C15E52E546c60CeCC2BBf6, // Real YieldYak Farm Testnet ✅
                wavax: 0xd00ae08403B9bbb9124bB305C09058E32C39A48c, // Real WAVAX ✅
                usdc: 0xB6076C93701D6a07266c31066B298AeC6dd65c2d // Real USDC Fuji ✅
            });
    }

    /**
     * @dev Get Avalanche Mainnet configuration
     */
    function getMainnetConfig() internal pure returns (Config memory) {
        return
            Config({
                traderJoeRouter: 0x60aE616a2155Ee3d9A68541Ba4544862310933d4, // Real TraderJoe Router
                yieldYakFarm: 0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7, // Real YieldYak Farm (mainnet) ✅
                wavax: 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7, // Real WAVAX
                usdc: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E // Real Circle USDC
            });
    }

    /**
     * @dev Get Local/Fork network configuration
     * @notice Returns deterministic mock addresses for local testing
     */
    function getLocalConfig() internal pure returns (Config memory) {
        return
            Config({
                traderJoeRouter: _makeAddr("mockTraderJoe"),
                yieldYakFarm: _makeAddr("mockYieldYak"),
                wavax: _makeAddr("mockWAVAX"),
                usdc: _makeAddr("mockUSDC")
            });
    }

    /**
     * @dev Create deterministic address from string
     */
    function _makeAddr(string memory name) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(name)))));
    }

    /**
     * @dev Get fork configuration for localhost (uses Fuji testnet addresses)
     * @notice Use this when running a local fork of Fuji testnet
     */
    function getForkConfig() internal pure returns (Config memory) {
        // When forking, use the same addresses as the forked network
        return getFujiConfig();
    }

    /**
     * @dev Get configuration with explicit fork parameter
     * @param chainId The chain ID to get configuration for
     * @param isFork Whether we're running on a fork (passed by user)
     */
    function getConfigForChain(
        uint256 chainId,
        bool isFork
    ) internal pure returns (Config memory) {
        if (chainId == 43114) {
            // Avalanche Mainnet
            return getMainnetConfig();
        } else if (chainId == 43113) {
            // Avalanche Fuji Testnet
            return getFujiConfig();
        } else {
            // Localhost or other networks
            if (isFork) {
                return getForkConfig(); // Use testnet addresses when forking
            } else {
                return getLocalConfig(); // Use mock addresses for pure local
            }
        }
    }

    /**
     * @dev Get configuration based on chain ID (legacy function for backward compatibility)
     * @param chainId The chain ID to get configuration for
     */
    function getConfigForChain(
        uint256 chainId
    ) internal pure returns (Config memory) {
        return getConfigForChain(chainId, false); // Default to local config
    }

    /**
     * @dev Validate that all addresses in config are non-zero
     * @param config The configuration to validate
     */
    function isValidConfig(Config memory config) internal pure returns (bool) {
        return
            config.traderJoeRouter != address(0) &&
            config.yieldYakFarm != address(0) &&
            config.wavax != address(0) &&
            config.usdc != address(0);
    }
}
