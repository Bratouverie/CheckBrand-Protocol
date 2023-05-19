// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../access/roles/PlatformRoles.sol";
import "../interfaces/IMasterStation.sol";

/**
 * @title CBCOIN
 * @dev CBCOIN is an ERC20 token with minting and burning capabilities.
 * The contract inherits from OpenZeppelin's ERC20 contract
 */

contract CBCOIN is PlatformRoles, ERC20 {

    IMasterStation public immutable masterStation;
    uint256 public supplyLimit;

     /**
     * @dev Constructor that initializes the contract with a name, symbol, 
     * master station address and supply limit.
     */
    constructor(
        IMasterStation _masterStation, 
        uint256 _supplyLimit
    ) ERC20("CheckBrandCoin_test", "CBCOIN_t") {
        masterStation = _masterStation;
        supplyLimit = _supplyLimit;
    }

    /**
     * @dev Allows minting of new tokens to a specified address.
     * Access is restricted to accounts with the DEFAULT_ADMIN_ROLE.
     *
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external {
        masterStation.checkAccessToPlatform(DEFAULT_ADMIN_ROLE, _msgSender());
        _mint(to, amount);

        require(supplyLimit >= totalSupply(), "CBCOIN: Supply limit reached");
    }

    /**
     * @dev Allows burning of tokens from a specified address.
     * Access is restricted to the token owner.
     *
     * @param account The address to burn tokens from.
     * @param amount The amount of tokens to burn.
     */
    function burn(address account, uint256 amount) external {
        require(account == _msgSender(), "CBCOIN: Token owner only");

        _burn(account, amount);
    }
}