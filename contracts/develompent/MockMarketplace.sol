// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title MockMarketplace
 * @dev ONLY FOR TESTS
 *      PLEASE DONT USE IN PRODUCTION
 */

contract MockMarketplace {

    using Address for address payable;

    mapping(uint256 => address) public sellBy;
    mapping(uint256 => uint256) public price;
    address public token;

    constructor(address _token) {
        token = _token;
    }

    function sell(uint256 tokenId, uint256 tokenPrice) external {
        sellBy[tokenId] = msg.sender;
        price[tokenId] = tokenPrice;
    }

    function buy1(uint256 tokenId) external payable {
        require(price[tokenId] == msg.value, "!price");

        IERC721(token).transferFrom(
            sellBy[tokenId], 
            msg.sender, 
            tokenId
        );

        (address receiver, uint256 royaltyAmount) = IERC2981(token).royaltyInfo(tokenId, msg.value);
        payable(receiver).sendValue(royaltyAmount);
        payable(sellBy[tokenId]).sendValue(msg.value - royaltyAmount);
    }

    function buy2(uint256 tokenId) external payable {
        require(price[tokenId] == msg.value, "!price");

        (address receiver, uint256 royaltyAmount) = IERC2981(token).royaltyInfo(tokenId, msg.value);
        payable(receiver).sendValue(royaltyAmount);
        payable(sellBy[tokenId]).sendValue(msg.value - royaltyAmount);
        
        IERC721(token).transferFrom(
            sellBy[tokenId], 
            msg.sender, 
            tokenId
        );
    }
}