// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../access/roles/PlatformRoles.sol";
import "../interfaces/IMasterStation.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Treasury
/// @notice A contract for managing the treasury of the platform
/// @dev Inherits from PlatformRoles for access control
contract Treasury is PlatformRoles {

    // Using SafeERC20 for IERC20 to ensure safe and correct token transfers.
    /// @dev SafeERC20 library used for safe token transfers
    using SafeERC20 for IERC20;

    /// @dev CBCOIN token instance
    IERC20 public immutable CBCOIN;
    /// @dev MasterStation contract instance
    IMasterStation public immutable masterStation;
    /// @dev Address of the Payments contract
    address public paymentsContractAddress;

    /// @notice Event emitted when the Payments contract address is updated
    event PaymentContractSetted(address indexed previousAddress, address indexed actualAddress);
    /// @notice Event emitted when funds are withdrawn from the Treasury
    event Withdrawn(address indexed receiver, uint256 indexed amount, address indexed sender);

    /// @param cbcoin The address of the CBCOIN ERC20 token
    /// @param _masterStation The address of the MasterStation contract
    constructor(IERC20 cbcoin, IMasterStation _masterStation) {
        CBCOIN = cbcoin;
        masterStation = _masterStation;
    }

    /// @notice Get the total supply of CBCOIN held by the Treasury
    function totalSupply() external view returns (uint256) {
        return CBCOIN.balanceOf(address(this));
    }

    /// @notice Withdraw amount of CBCOIN from the Treasury
    /// @dev Access is limited to the Payments contract or platform admins
    /// @param receiver The address to receive the withdrawn amount
    /// @param amount The amount of CBCOIN to withdraw
    function withdraw(address receiver, uint256 amount) external {
        if (msg.sender != paymentsContractAddress)
            masterStation.checkAccessToPlatform(DEFAULT_ADMIN_ROLE, msg.sender);

        require(CBCOIN.balanceOf(address(this)) >= amount, "Treasury: Insufficient funds");
        CBCOIN.safeTransfer(receiver, amount);
        emit Withdrawn(receiver, amount, msg.sender);
    }

    /// @notice Set the address of the Payments contract
    /// @dev Accessible only by platform admins
    /// @param _payments The address of the Payments contract
    function setPaymentsContractAddress(address _payments) external {
        masterStation.checkAccessToPlatform(DEFAULT_ADMIN_ROLE, msg.sender);

        emit PaymentContractSetted(paymentsContractAddress, _payments);
        paymentsContractAddress = _payments;
    }
}