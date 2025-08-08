// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ITraderJoe
 * @dev Interface for TraderJoe DEX interactions
 * @notice This interface covers the main TraderJoe router functions needed for our yield optimization
 */
interface ITraderJoe {
    /**
     * @dev Add liquidity to AVAX/Token pair
     * @param token The ERC20 token to pair with AVAX
     * @param amountTokenDesired Amount of tokens to add as liquidity
     * @param amountTokenMin Minimum amount of tokens (slippage protection)
     * @param amountAVAXMin Minimum amount of AVAX (slippage protection)
     * @param to Address to receive LP tokens
     * @param deadline Transaction deadline timestamp
     * @return amountToken Actual amount of tokens added
     * @return amountAVAX Actual amount of AVAX added
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidityAVAX(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountAVAXMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountAVAX, uint256 liquidity);

    /**
     * @dev Remove liquidity from AVAX/Token pair
     * @param token The ERC20 token paired with AVAX
     * @param liquidity Amount of LP tokens to burn
     * @param amountTokenMin Minimum amount of tokens to receive
     * @param amountAVAXMin Minimum amount of AVAX to receive
     * @param to Address to receive tokens and AVAX
     * @param deadline Transaction deadline timestamp
     * @return amountToken Amount of tokens received
     * @return amountAVAX Amount of AVAX received
     */
    function removeLiquidityAVAX(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountAVAXMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountAVAX);

    /**
     * @dev Swap exact AVAX for tokens
     * @param amountOutMin Minimum amount of tokens to receive
     * @param path Array of token addresses representing the swap path
     * @param to Address to receive tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of amounts for each step in the path
     */
    function swapExactAVAXForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    /**
     * @dev Swap exact tokens for AVAX
     * @param amountIn Amount of tokens to swap
     * @param amountOutMin Minimum amount of AVAX to receive
     * @param path Array of token addresses representing the swap path
     * @param to Address to receive AVAX
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of amounts for each step in the path
     */
    function swapExactTokensForAVAX(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
     * @dev Get reserves for a trading pair
     * @param tokenA First token in the pair
     * @param tokenB Second token in the pair
     * @return reserveA Reserve amount of tokenA
     * @return reserveB Reserve amount of tokenB
     */
    function getReserves(address tokenA, address tokenB)
        external
        view
        returns (uint256 reserveA, uint256 reserveB);

    /**
     * @dev Calculate optimal amounts for adding liquidity
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amountADesired Desired amount of tokenA
     * @param amountBDesired Desired amount of tokenB
     * @param amountAMin Minimum amount of tokenA
     * @param amountBMin Minimum amount of tokenB
     * @return amountA Optimal amount of tokenA
     * @return amountB Optimal amount of tokenB
     */
    function quote(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external view returns (uint256 amountA, uint256 amountB);

    /**
     * @dev Get current APY for a specific LP pair
     * @param pair The LP pair address
     * @return apy Current APY in basis points (e.g., 800 = 8%)
     */
    function getPoolAPY(address pair) external view returns (uint256 apy);

    /**
     * @dev Get the factory address
     * @return factory The factory contract address
     */
    function factory() external pure returns (address factory);

    /**
     * @dev Get the WAVAX token address
     * @return WAVAX The wrapped AVAX token address
     */
    function WAVAX() external pure returns (address WAVAX);
}

/**
 * @title ITraderJoeFactory
 * @dev Interface for TraderJoe Factory contract
 */
interface ITraderJoeFactory {
    /**
     * @dev Get pair address for two tokens
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair The pair contract address
     */
    function getPair(address tokenA, address tokenB) external view returns (address pair);

    /**
     * @dev Create a new trading pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair The new pair contract address
     */
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

/**
 * @title ITraderJoePair
 * @dev Interface for TraderJoe LP token contract
 */
interface ITraderJoePair {
    /**
     * @dev Get token reserves
     * @return reserve0 Reserve of token0
     * @return reserve1 Reserve of token1
     * @return blockTimestampLast Timestamp of last update
     */
    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    /**
     * @dev Get token0 address
     * @return token0 Address of first token in the pair
     */
    function token0() external view returns (address token0);

    /**
     * @dev Get token1 address
     * @return token1 Address of second token in the pair
     */
    function token1() external view returns (address token1);

    /**
     * @dev Get total supply of LP tokens
     * @return totalSupply Total LP token supply
     */
    function totalSupply() external view returns (uint256 totalSupply);

    /**
     * @dev Burn LP tokens and receive underlying tokens
     * @param to Address to receive tokens
     * @return amount0 Amount of token0 received
     * @return amount1 Amount of token1 received
     */
    function burn(address to) external returns (uint256 amount0, uint256 amount1);

    /**
     * @dev Mint LP tokens by providing liquidity
     * @param to Address to receive LP tokens
     * @return liquidity Amount of LP tokens minted
     */
    function mint(address to) external returns (uint256 liquidity);
}