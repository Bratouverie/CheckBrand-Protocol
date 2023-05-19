// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../access/roles/PlatformRoles.sol";
import "../access/Validator.sol";

import "../interfaces/IMasterStation.sol";
import "../interfaces/finance/ITreasury.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Payments
/// @notice A contract for managing payments and token purchases on the platform
/// @dev Inherits from PlatformRoles and Validator for access control and signature validation
contract Payments is PlatformRoles, Validator {

    /// @dev Address library used for safe value transfers
    using Address for address payable;
    /// @dev SafeERC20library used for safe token transfers
    using SafeERC20 for IERC20;

    /// @dev MasterStation contract instance
    IMasterStation public immutable masterStation;
    /// @dev Treasury contract instance
    ITreasury public immutable CBCOINTreasury;

    /// @notice Event emitted when CBCOIN is purchased with a payment token
    event PurchasedCBCOINWithToken(address indexed paymentToken, address indexed receiver, uint256 paymentAmount, uint256 purchasedCBCOINAmount);
    /// @notice Event emitted when CBCOIN is purchased with ETH
    event PurchasedCBCOINWithETH(address indexed receiver, uint256 paymentAmount, uint256 purchasedCBCOINAmount);

    /// @notice Event emitted when a payment is made for the creation of a collection
    event PayedForTheCreationOfACollection(address indexed account, uint256 indexed paymentAmount, uint256 indexed supplyLimiy);

    /// @notice Event emitted when a token is withdrawn from the Payments contract
    event TokenWithdrawn(address indexed token, address indexed receiver, address indexed sender, uint256 amount);
    /// @notice Event emitted when ETH is withdrawn from the Payments contract
    event ETHWithdrawn(address indexed receiver, address indexed sender, uint256 amount);

    /// @param _treasury The address of the Treasury contract
    /// @param _masterStation The address of the MasterStation contract
    constructor(
        ITreasury _treasury,
        IMasterStation _masterStation
    ) {
        CBCOINTreasury = _treasury;
        masterStation = _masterStation;
    }

    /// @notice Purchase CBCOIN with a payment token
    /// @dev Signature validation and access control are enforced
    /// @param _data The data containing purchase details
    /// @param _signature The array of signatures for purchase validation
    function purchaseCBCOINWithToken(
        BuyTokensData memory _data,
        Signature[] memory _signature
    ) external {
        require(_data.receiver != address(0), "Payments: Incorrect receiver address");
        require(_data.paymentToken != address(0), "Payments: Incorrect payment token address");
        require(_data.paymentAmount > 0, "Payments: Incorrect payment token amount");
        require(_data.amountOfCBCOINToPurchase > 0, "Payments: Incorrect purschased token amount");

        _buyTokensValidateHashAndCheckPermit(_data, _signature);

        IERC20(_data.paymentToken).safeTransferFrom(msg.sender, address(this), _data.paymentAmount);
        CBCOINTreasury.withdraw(_data.receiver, _data.amountOfCBCOINToPurchase);

        emit PurchasedCBCOINWithToken(_data.paymentToken, _data.receiver, _data.paymentAmount, _data.amountOfCBCOINToPurchase);
    }

    /// @notice Purchase CBCOIN with ETH
    /// @dev Signature validation and access control are enforced
    /// @param _data The data containing purchase details
    /// @param _signature The array of signatures for purchase validation
    /// @return residue The remaining ETH balance after purchase
    function purchaseCBCOINWithETH(
        BuyTokensData memory _data,
        Signature[] memory _signature
    ) external payable returns (uint256 residue) {
        require(_data.receiver != address(0), "Payments: Incorrect receiver address");
        require(_data.paymentToken == address(0), "Payments: Payment token address should be 0 when using ETH");
        require(_data.paymentAmount > 0, "Payments: Incorrect ETH amount");
        require(_data.amountOfCBCOINToPurchase > 0, "Payments: Incorrect purschased token amount");
        require(msg.value >= _data.paymentAmount, "Payments: Insufficient ETH sent");

        _buyTokensValidateHashAndCheckPermit(_data, _signature);
        CBCOINTreasury.withdraw(_data.receiver, _data.amountOfCBCOINToPurchase);

        residue = msg.value - _data.paymentAmount;
        if (residue > 0) {
            payable(msg.sender).sendValue(residue);
        }

        emit PurchasedCBCOINWithETH(_data.receiver, _data.paymentAmount, _data.amountOfCBCOINToPurchase);
    }

    /// @notice Make a payment for the creation of a collection
    /// @dev Signature validation and access control are enforced
    /// @param _data The data containing collection creation details
    /// @param _signature The array of signatures for creation validation
    /// @return true if the payment is successful
    function paymentForTheCreationOfACollection(
        CreateCollectionData memory _data,
        Signature[] memory _signature
    ) external returns (bool) {
        require(msg.sender == address(masterStation), "Payments: Only master station can call this");
        require(_data.supplyLimit > 0, "Payments: Incorrect supply limit");
        require(_data.paymentAmount > 0, "Payments: Incorrect CBCOIN amount");

        _createCollectionValidateHashAndCheckPermit(_data, _signature);

        IERC20(CBCOINTreasury.CBCOIN()).safeTransferFrom(msg.sender, address(this), _data.paymentAmount);
        emit PayedForTheCreationOfACollection(_data.creator, _data.paymentAmount, _data.supplyLimit);

        return true;
    }

    /// @notice Withdraw funds (tokens or ETH) from the Payments contract
    /// @dev Accessible only by DEFAULT_ADMIN_ROLE
    /// @param _tokenToWithdraw The address of the token to withdraw, or 0 for ETH
    /// @param _receiver The address to receive the withdrawn funds
    function withdrawFunds(address _tokenToWithdraw, address _receiver) external {
        masterStation.checkAccessToPlatform(DEFAULT_ADMIN_ROLE, msg.sender);

        if (_tokenToWithdraw != address(0)) {
            uint256 amount = IERC20(_tokenToWithdraw).balanceOf(address(this));
            IERC20(_tokenToWithdraw).safeTransfer(_receiver, amount);
            emit TokenWithdrawn(_tokenToWithdraw, _receiver, msg.sender, amount);
        }

        uint256 balance = address(this).balance ;
        if (balance > 0) {
            payable(_receiver).sendValue(balance);
            emit ETHWithdrawn(_receiver, msg.sender, balance);
        }
    }

    /// @notice Set the minimum number of validator verifications required for transactions
    /// @dev Accessible only by DEFAULT_ADMIN_ROLE
    /// @param _minVerificationsCount The minimum number of verifications required
    function setMinVerificationsCount(uint256 _minVerificationsCount) external {
        masterStation.checkAccessToPlatform(DEFAULT_ADMIN_ROLE, msg.sender);
        _setMinVerificationsCount(_minVerificationsCount);
    }

    /// @notice Get the list of validator addresses
    /// @return An array containing the validator addresses
    function listValidators() public view returns (address[] memory) {
        return masterStation.listValidators();
    }

    /// @notice Verify if the recovered signer is a validator
    /// @dev Overrides the function in the Validator contract
    /// @param _recoveredSigner The recovered signer's address
    /// @return true if the signer is a validator
    function _verify(address _recoveredSigner) internal view override returns (bool) {
        return masterStation.isValidator(_recoveredSigner);
    }
}