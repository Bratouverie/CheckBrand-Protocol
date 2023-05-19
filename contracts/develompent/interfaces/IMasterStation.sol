// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IMasterStation {
    function isCollectionEnabled(address _collectin) external view returns (bool);
    function checkCollectionByBrand(string calldata _brand, address _collection) external view;

    function checkAccessToPlatform(uint8 _role, address _account) external view;
    function checkAccessToBrand(string calldata _brand, uint8 _role, address _account) external view;
    function checkAccessToCollection(
        string calldata _brand, 
        address _collection, 
        uint8 _role, 
        address _account
    ) external view;

    function hasAccessToPlatform(uint8 _role, address _account) external view returns (bool);
    function hasAccessToBrand(string calldata _brand, uint8 _role, address _account) external view returns (bool);
    function hasAccessToCollection(
        string calldata _brand, 
        address _collection,
        uint8 _role, 
        address _account
    ) external view returns (bool);


    function isValidator(address _account) external view returns (bool);
    function listValidators() external view returns (address[] memory);
}