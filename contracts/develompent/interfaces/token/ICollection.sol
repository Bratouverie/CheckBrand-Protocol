// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "./ICollectionData.sol";

interface ICollection is IERC721Enumerable, ICollectionData {
    
    function owner() external view returns (address);
}