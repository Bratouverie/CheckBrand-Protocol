// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./token/ICollectionData.sol";

interface IFactory is ICollectionData {
    function deployCollection(
        string memory _brand, 
        address _creator, 
        uint256 _supplyLimit, 
        CollectionData memory _data
    ) external returns (address collection);
}