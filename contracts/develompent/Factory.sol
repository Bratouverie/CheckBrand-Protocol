// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Importing the ProxiedCollection contract and relevant interfaces
import "./token/ProxiedCollection.sol";
import "./interfaces/token/IProxiedCollection.sol";
import "./interfaces/token/ICollectionData.sol";

/// @title Factory contract for creating and managing ProxiedCollection contracts
/// @notice This contract is responsible for deploying new instances of ProxiedCollection and keeping track of them
contract Factory is ICollectionData {

    // Address of the master station contract
    address public immutable masterStation;
    // Address of the ProxiedCollection implementation contract
    address public immutable implementation;
    
    // Array to store the addresses of all deployed ProxiedCollection contracts
    address[] public deployedCollections;

    // Event to be emitted when a new ProxiedCollection is deployed
    event CollectionDeployed(
        string indexed brand,
        string indexed name,
        string indexed symbol,
        address deployer,
        uint256 supplyLimit,
        address collectionAddress
    );

    /// @notice Constructor for the Factory contract
    /// @param _masterStation The address of the master station contract
    /// @param _implementation The address of the ProxiedCollection implementation contract
    constructor(
        address _masterStation,
        address _implementation
    ) {
        masterStation = _masterStation;
        implementation = _implementation;
    }

    /// @notice Get the number of deployed ProxiedCollection contracts
    /// @return The number of deployed ProxiedCollection contracts
    function deployedCollectionsLength() public view returns (uint) {
        return deployedCollections.length;
    }

    /// @notice Deploy a new ProxiedCollection contract
    /// @param _brand The brand name for the new collection
    /// @param _creator The address of the creator deploying the collection
    /// @param _supplyLimit The supply limit for the new collection
    /// @param _data Additional data for the new collection
    /// @return collection - The address of the newly deployed ProxiedCollection contract
    function deployCollection(
        string memory _brand, 
        address _creator, 
        uint256 _supplyLimit, 
        CollectionData memory _data
    ) external returns (address collection) {
        // Ensure the caller is the master station contract
        require(msg.sender == masterStation, "Factory: Master only");
        
        // Generate the bytecode for creating a new ProxiedCollection contract
        bytes memory bytecode = type(ProxiedCollection).creationCode;
        // Encode the implementation address into the deployment data
        bytes memory data = abi.encodePacked(bytecode, abi.encode(implementation));
        // Generate a salt based on the number of deployed collections
        bytes32 salt = bytes32(deployedCollectionsLength());
        assembly {
            // Deploy the ProxiedCollection contract using create2
            collection := create2(0, add(data, 0x20), mload(data), salt)
        }
        // Initialize the newly deployed ProxiedCollection contract
        IProxiedCollection(collection).initialize(
            masterStation,
            _brand,
            _creator,
            _supplyLimit,
            _data
        );
        // Add the new ProxiedCollection address to the list of deployed collections
        deployedCollections.push(collection);

        // Emit the CollectionDeployed event
        emit CollectionDeployed(
            _brand,
            _data.name,
            _data.symbol,
            _creator,
            _supplyLimit,
            collection
        );
    }
}