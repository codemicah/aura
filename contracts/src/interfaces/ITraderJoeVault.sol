// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ITraderJoeVault
 * @dev Interface for TraderJoe Vault contract for single asset staking
 * @notice This interface covers the TraderJoe vault functions for AVAX deposits
 */
interface ITraderJoeVault {
    /**
     * @dev Deposit AVAX into the vault for yield generation
     */
    function deposit() external payable;

    /**
     * @dev Withdraw AVAX from the vault
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external;

    /**
     * @dev Get the balance of a user in the vault
     * @param user User address
     * @return balance User's vault balance
     */
    function balanceOf(address user) external view returns (uint256 balance);

    /**
     * @dev Get the current APY of the vault
     * @return apy Current APY in basis points
     */
    function getAPY() external view returns (uint256 apy);

    /**
     * @dev Get total assets under management
     * @return totalAssets Total AVAX in the vault
     */
    function totalAssets() external view returns (uint256 totalAssets);
}
