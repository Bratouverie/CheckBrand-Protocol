// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ITreasury {
    
    function withdraw(address receiver, uint256 amount) external;
    function totalSupply() external view returns (uint256);
    function CBCOIN() external view returns (address);
}