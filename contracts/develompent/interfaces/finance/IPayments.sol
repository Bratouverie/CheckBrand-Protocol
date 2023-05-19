// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../access/IValidator.sol";

interface IPayments is IValidator {
    
    function paymentForTheCreationOfACollection(
        CreateCollectionData memory _data,
        Signature[] memory _signatures
    ) external returns (bool);

    function purchaseCBCOINWithToken(
        BuyTokensData memory _data,
        Signature[] memory _signatures
    ) external;

    function purchaseCBCOINWithETH(
        BuyTokensData memory _data,
        Signature[] memory _signatures
    ) external payable returns (uint256 residue);
}