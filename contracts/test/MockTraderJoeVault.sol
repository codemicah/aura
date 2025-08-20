// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MockTraderJoeVault
 * @dev Mock implementation for testing purposes
 */
contract MockTraderJoeVault {
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        payable(msg.sender).transfer(amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }

    function getAPY() external pure returns (uint256) {
        return 800; // 8% APY
    }

    function totalAssets() external view returns (uint256) {
        return totalDeposits;
    }

    // Allow contract to receive ETH
    receive() external payable {
        this.deposit();
    }
}
