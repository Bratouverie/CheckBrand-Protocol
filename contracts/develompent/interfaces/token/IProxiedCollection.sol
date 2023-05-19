// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./ICollectionData.sol";

interface IProxiedCollection is ICollectionData {
    function initialize(
        address _masterStation,
        string memory _brand,
        address _creator, 
        uint256 _supplyLimit,
        CollectionData memory _data
    ) external;
}