// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Import OpenZeppelin's TransparentUpgradeableProxy contract
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
// Import the IProxiedCollection interface
import "../interfaces/token/IProxiedCollection.sol";

/**
 * @title ProxiedCollection
 * @notice A transparent proxy contract for managing token collections
 * @dev Inherits from OpenZeppelin's TransparentUpgradeableProxy contract
 */
contract ProxiedCollection is TransparentUpgradeableProxy {

    /**
     * @notice Constructor for the ProxiedCollection contract
     * @param _logic The address of the initial implementation contract
     * @dev Calls the TransparentUpgradeableProxy constructor
     * with the implementation address, admin address, and empty data
     */
    constructor(address _logic) 
    TransparentUpgradeableProxy(
        _logic, 
        msg.sender, 
        ""
    ) {}

    /**
     * @notice Internal fallback function for handling calls to the proxy contract
     * @dev Overrides the _fallback function from the TransparentUpgradeableProxy contract
     * Checks if the caller is the admin and if the called function is the initialize function
     * If both conditions are true, the implementation contract is delegated. Otherwise, it falls back to the parent contract
     */
    function _fallback() internal override {
        bytes4 selector = msg.sig;
        if (
            msg.sender == _getAdmin() &&
            selector == IProxiedCollection.initialize.selector
        ) {
            _delegate(_implementation());
        } else super._fallback();
    }
}