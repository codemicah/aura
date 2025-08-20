// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IAave
 * @dev Interface for Aave V3 Pool interactions
 * @notice This interface covers the main Aave V3 functions needed for yield optimization
 */
interface IAave {
    /**
     * @dev Supply assets to the protocol
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Code used to register the integrator originating the operation
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /**
     * @dev Withdraws an amount of underlying asset from the reserve
     * @param asset The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn
     * @param to The address that will receive the underlying
     * @return The final amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    /**
     * @dev Get the current supply APY for a reserve
     * @param asset The address of the underlying asset
     * @return configuration Reserve configuration data
     * @return liquidityIndex Current liquidity index
     * @return currentLiquidityRate Current supply rate in ray format (1e27)
     * @return variableBorrowIndex Current variable borrow index
     * @return currentVariableBorrowRate Current variable borrow rate
     * @return currentStableBorrowRate Current stable borrow rate
     * @return lastUpdateTimestamp Last update timestamp
     * @return id Reserve ID
     * @return aTokenAddress Address of the aToken
     * @return stableDebtTokenAddress Address of stable debt token
     * @return variableDebtTokenAddress Address of variable debt token
     * @return interestRateStrategyAddress Address of interest rate strategy
     * @return accruedToTreasury Amount accrued to treasury
     * @return unbacked Unbacked amount
     * @return isolationModeTotalDebt Total debt in isolation mode
     */
    function getReserveData(
        address asset
    )
        external
        view
        returns (
            uint256 configuration,
            uint128 liquidityIndex,
            uint128 currentLiquidityRate,
            uint128 variableBorrowIndex,
            uint128 currentVariableBorrowRate,
            uint128 currentStableBorrowRate,
            uint40 lastUpdateTimestamp,
            uint16 id,
            address aTokenAddress,
            address stableDebtTokenAddress,
            address variableDebtTokenAddress,
            address interestRateStrategyAddress,
            uint128 accruedToTreasury,
            uint128 unbacked,
            uint128 isolationModeTotalDebt
        );

    /**
     * @dev Get user account data across all the reserves
     * @param user The address of the user
     * @return totalCollateralBase Total collateral of the user in base currency
     * @return totalDebtBase Total debt of the user in base currency
     * @return availableBorrowsBase Available borrow capacity in base currency
     * @return currentLiquidationThreshold Current liquidation threshold
     * @return ltv Current loan to value
     * @return healthFactor Current health factor
     */
    function getUserAccountData(
        address user
    )
        external
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );
}

/**
 * @title IAaveToken
 * @dev Interface for Aave aToken interactions
 */
interface IAaveToken {
    /**
     * @dev Returns the amount of tokens owned by account
     * @param account The address to query
     * @return balance The amount of tokens owned by the account
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Burns aTokens from user and sends the equivalent amount of underlying to receiverOfUnderlying
     * @param from The address from which the aTokens will be burned
     * @param receiverOfUnderlying The address that will receive the underlying
     * @param amount The amount being burned
     * @param index The next liquidity index of the reserve
     */
    function burn(
        address from,
        address receiverOfUnderlying,
        uint256 amount,
        uint256 index
    ) external;

    /**
     * @dev Returns the scaled balance of the user
     * @param user The address of the user
     * @return The scaled balance of the user
     */
    function scaledBalanceOf(address user) external view returns (uint256);
}
