// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IWAVAX
 * @dev Interface for Wrapped AVAX (WAVAX) token
 * @notice Extends IERC20 with deposit and withdraw functions for AVAX wrapping
 */
interface IWAVAX is IERC20 {
    /**
     * @dev Deposit AVAX and receive WAVAX in return
     * @notice Payable function that wraps sent AVAX into WAVAX tokens
     */
    function deposit() external payable;

    /**
     * @dev Withdraw AVAX by burning WAVAX
     * @param amount Amount of WAVAX to burn for AVAX
     */
    function withdraw(uint256 amount) external;
}
