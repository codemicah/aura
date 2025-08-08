// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IBenqi
 * @dev Interface for Benqi lending protocol interactions
 * @notice This interface covers the main Benqi functions needed for yield optimization
 */
interface IBenqi {
    /**
     * @dev Supply AVAX to the protocol and receive qiAVAX tokens
     * @notice Payable function that accepts AVAX deposits
     */
    function mint() external payable;

    /**
     * @dev Redeem qiAVAX tokens for underlying AVAX
     * @param redeemTokens Amount of qiAVAX tokens to redeem
     * @return success Whether the redemption was successful
     */
    function redeem(uint256 redeemTokens) external returns (uint256 success);

    /**
     * @dev Redeem qiAVAX tokens for a specific amount of underlying AVAX
     * @param redeemAmount Amount of underlying AVAX to redeem
     * @return success Whether the redemption was successful
     */
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256 success);

    /**
     * @dev Get the current supply rate per timestamp
     * @return rate The current supply APY in mantissa format
     */
    function supplyRatePerTimestamp() external view returns (uint256 rate);

    /**
     * @dev Get the current borrow rate per timestamp
     * @return rate The current borrow APY in mantissa format
     */
    function borrowRatePerTimestamp() external view returns (uint256 rate);

    /**
     * @dev Get the exchange rate from qiAVAX to underlying AVAX
     * @return rate The current exchange rate in mantissa format
     */
    function exchangeRateStored() external view returns (uint256 rate);

    /**
     * @dev Get the current exchange rate (may accrue interest)
     * @return rate The current exchange rate in mantissa format
     */
    function exchangeRateCurrent() external returns (uint256 rate);

    /**
     * @dev Get account's current qiAVAX balance
     * @param account The address to check
     * @return balance The qiAVAX token balance
     */
    function balanceOf(address account) external view returns (uint256 balance);

    /**
     * @dev Get account's underlying AVAX balance
     * @param account The address to check
     * @return balance The underlying AVAX balance
     */
    function balanceOfUnderlying(address account) external returns (uint256 balance);

    /**
     * @dev Get the total supply of qiAVAX tokens
     * @return supply Total qiAVAX token supply
     */
    function totalSupply() external view returns (uint256 supply);

    /**
     * @dev Get the total reserves
     * @return reserves Total reserves amount
     */
    function totalReserves() external view returns (uint256 reserves);

    /**
     * @dev Get the total cash (available liquidity)
     * @return cash Total available cash
     */
    function getCash() external view returns (uint256 cash);

    /**
     * @dev Accrue interest and update rates
     * @return success Whether interest accrual was successful
     */
    function accrueInterest() external returns (uint256 success);

    /**
     * @dev Transfer qiAVAX tokens
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether transfer was successful
     */
    function transfer(address to, uint256 amount) external returns (bool success);

    /**
     * @dev Approve qiAVAX token spending
     * @param spender Address to approve
     * @param amount Amount to approve
     * @return success Whether approval was successful
     */
    function approve(address spender, uint256 amount) external returns (bool success);

    /**
     * @dev Get allowance for qiAVAX tokens
     * @param owner Token owner address
     * @param spender Spender address
     * @return allowance Current allowance amount
     */
    function allowance(address owner, address spender) external view returns (uint256 allowance);
}

/**
 * @title IBenqiComptroller
 * @dev Interface for Benqi Comptroller contract
 */
interface IBenqiComptroller {
    /**
     * @dev Enter markets to enable borrowing
     * @param qiTokens Array of qiToken addresses to enter
     * @return results Array of error codes (0 = success)
     */
    function enterMarkets(address[] calldata qiTokens) external returns (uint256[] memory results);

    /**
     * @dev Exit a market to disable borrowing
     * @param qiToken The qiToken address to exit
     * @return success Whether exit was successful (0 = success)
     */
    function exitMarket(address qiToken) external returns (uint256 success);

    /**
     * @dev Get account's liquidity information
     * @param account Account address to check
     * @return error Error code (0 = success)
     * @return liquidity Account liquidity in USD
     * @return shortfall Account shortfall in USD
     */
    function getAccountLiquidity(address account)
        external
        view
        returns (uint256 error, uint256 liquidity, uint256 shortfall);

    /**
     * @dev Check if an address is a listed market
     * @param qiToken The qiToken address to check
     * @return isListed Whether the market is listed
     * @return collateralFactorMantissa The collateral factor
     */
    function markets(address qiToken)
        external
        view
        returns (bool isListed, uint256 collateralFactorMantissa);

    /**
     * @dev Get the current QI reward speeds
     * @param qiToken The qiToken address
     * @return supplySpeed QI supply reward speed
     * @return borrowSpeed QI borrow reward speed
     */
    function rewardSpeeds(address qiToken)
        external
        view
        returns (uint256 supplySpeed, uint256 borrowSpeed);

    /**
     * @dev Claim accrued QI rewards
     * @param holder Address to claim rewards for
     * @param qiTokens Array of qiTokens to claim from
     */
    function claimReward(address holder, address[] calldata qiTokens) external;

    /**
     * @dev Get accrued QI rewards for an account
     * @param holder Address to check rewards for
     * @return rewards Accrued reward amount
     */
    function rewardAccrued(address holder) external view returns (uint256 rewards);
}

/**
 * @title IBenqiLens
 * @dev Interface for Benqi Lens contract (for reading protocol data)
 */
interface IBenqiLens {
    struct QiTokenMetadata {
        address qiToken;
        uint256 exchangeRateCurrent;
        uint256 supplyRatePerTimestamp;
        uint256 borrowRatePerTimestamp;
        uint256 reserveFactorMantissa;
        uint256 totalBorrows;
        uint256 totalReserves;
        uint256 totalSupply;
        uint256 totalCash;
        bool isListed;
        uint256 collateralFactorMantissa;
        address underlyingAssetAddress;
        uint256 qiTokenDecimals;
        uint256 underlyingDecimals;
    }

    /**
     * @dev Get metadata for a qiToken
     * @param qiToken The qiToken address
     * @return metadata Complete metadata for the qiToken
     */
    function qiTokenMetadata(address qiToken) external returns (QiTokenMetadata memory metadata);

    /**
     * @dev Get metadata for all qiTokens
     * @param qiTokens Array of qiToken addresses
     * @return metadata Array of metadata for each qiToken
     */
    function qiTokenMetadataAll(address[] calldata qiTokens)
        external
        returns (QiTokenMetadata[] memory metadata);

    /**
     * @dev Get account snapshot for a qiToken
     * @param qiToken The qiToken address
     * @param account The account address
     * @return error Error code
     * @return balance qiToken balance
     * @return borrowBalance Borrow balance
     * @return exchangeRateMantissa Exchange rate
     */
    function getAccountSnapshot(address qiToken, address account)
        external
        view
        returns (uint256 error, uint256 balance, uint256 borrowBalance, uint256 exchangeRateMantissa);
}