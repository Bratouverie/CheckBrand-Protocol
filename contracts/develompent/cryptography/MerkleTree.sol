// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title MerkleTree library for managing Merkle tree data and operations
library MerkleTree {

    /// @dev MerkleData struct to store Merkle tree data
    struct MerkleData {
        bytes32 rootHash;
        mapping(bytes32 => uint256) actionsPerformed;
    }
    
    /// @notice Verifies if the action has not exceeded the limit for a given leaf
    /// @param _merkleData MerkleData storage containing Merkle tree data
    /// @param _leaf The leaf in the Merkle tree for which action needs to be checked
    /// @param _actionsLimit The maximum number of allowed actions for the leaf
    function checkAction(MerkleData storage _merkleData, bytes32 _leaf, uint256 _actionsLimit) internal view {
        require(_merkleData.actionsPerformed[_leaf] < _actionsLimit, "MerkleTree: Action already performed");
    }

    /// @notice Performs an action for a given leaf by incrementing its action count
    /// @param _merkleData MerkleData storage containing Merkle tree data
    /// @param _leaf The leaf in the Merkle tree for which action needs to be performed
    /// @param _actionsLimit The maximum number of allowed actions for the leaf
    function performAction(MerkleData storage _merkleData, bytes32 _leaf, uint256 _actionsLimit) internal {
        checkAction(_merkleData, _leaf, _actionsLimit);
        ++_merkleData.actionsPerformed[_leaf];
    }

    /// @notice Verifies if the leaf is part of the Merkle tree using the Merkle proof
    /// @param _merkleData MerkleData storage containing Merkle tree data
    /// @param _leaf The leaf to be verified
    /// @param _merkleProof The Merkle proof for the leaf
    /// @return True if the leaf is part of the Merkle tree, False otherwise
    function verify(MerkleData storage _merkleData, bytes32 _leaf, bytes32[] calldata _merkleProof) internal view returns (bool) {
        return MerkleProof.verify(_merkleProof, _merkleData.rootHash, _leaf);
    }

    /// @notice Updates the root hash of the Merkle tree
    /// @param _merkleData MerkleData storage containing Merkle tree data
    /// @param _newRootHash The new root hash for the Merkle tree
    function update(MerkleData storage _merkleData, bytes32 _newRootHash) internal {
        _merkleData.rootHash = _newRootHash;
    }

    /// @notice Retrieves the root hash of the Merkle tree
    /// @param _merkleData MerkleData storage containing Merkle tree data
    /// @return The root hash of the Merkle tree
    function getRoot(MerkleData storage _merkleData) internal view returns (bytes32) {
        return _merkleData.rootHash;
    }
}