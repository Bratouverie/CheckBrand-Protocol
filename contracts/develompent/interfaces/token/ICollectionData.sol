// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ICollectionData {

    enum MintStage { DISABLED, PUBLIC, OVERALL }

    struct CollectionData {
        string name;
        string symbol;
        string baseURI;
        bytes32 whitelist;
        bytes32 bookingList;
        uint256 publicMintTokensLimit;
        uint96 earnings;
        MintStage mintStage;
    }
}

