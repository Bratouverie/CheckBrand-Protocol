// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../token/ICollectionData.sol";

interface IValidator {

    struct BuyTokensData {
        address receiver;
        address paymentToken;
        uint256 paymentAmount;
        uint256 amountOfCBCOINToPurchase;
        uint256 deadline;
        uint256 salt;
    }

    struct CreateCollectionData {
        string brandName;
        address creator;
        uint256 supplyLimit;
        uint256 paymentAmount;
        uint256 deadline;
        uint256 salt;
    }

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
}