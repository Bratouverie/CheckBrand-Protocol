// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/access/IValidator.sol";

/**
 * @title Validator
 * @notice This contract is responsible for validating and verifying signatures.
 * @dev Inherits from IValidator interface.
 */

contract Validator is IValidator {

    // Hash constants for different types of operations.
    bytes32 public constant DOMAIN_TYPE_HASH =
        keccak256("Domain(uint256 chainId,address contractAddress)");

    bytes32 public constant BUY_TOKENS_TYPE_HASH =
        keccak256("BuyTokens(address receiver,address paymentToken,uint256 paymentAmount,uint256 amountOfCBCOINToPurchase,uint256 deadline,uint256 salt)");

    bytes32 public constant CREATE_TOLLECTION_TYPE_HASH =
        keccak256("CreateCollection(string brandName,address creator,uint256 supplyLimit,uint256 paymentAmount,uint256 deadline,uint256 salt)");

    // Cached domain separator for EIP-712 compatibility.
    bytes32 public immutable CACHED_DOMAIN_SEPARATOR;

    // Mapping to store validated hashes.
    mapping(bytes32 => bool) public validated;

    // Minimum number of verifications required.
    uint256 public minVerificationsCount;
    uint256 public nonce;

    // Mapping to check for duplicate validators.
    mapping(address => bool) private duplicateExist;

    // Events
    event ValidatedFrom(bytes32 hashData, address validator);
    event BuyTokensValidated(BuyTokensData data, uint256 verifications);
    event CreateCollectionValidated(CreateCollectionData data, uint256 verifications);
    event SettedMinVerificationsCount(uint256 count);

    /**
     * @notice Constructor function initializes the contract.
     */
    constructor() {
        CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator();
        minVerificationsCount = 1;
    }

    /**
     * @notice Returns the domain separator for the current chain and contract.
     * @dev Internal function to calculate domain separator.
     * @return The domain separator.
     */
    function _buildDomainSeparator() private view returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_TYPE_HASH, block.chainid, address(this)));
    }

    /**
     * @notice Check if the given struct hash is validated.
     * @param _structHash The hash to check.
     * @return True if validated, false otherwise.
     */
    function _isValidated(bytes32 _structHash) internal view returns (bool) {
        return validated[_structHash];
    }

    /**
     * @notice Marks the given struct hash as validated.
     * @param _structHash The hash to validate.
     */
    function _validateHash(bytes32 _structHash) internal {
        require(!_isValidated(_structHash), "Validator: Hash already validated");

        validated[_structHash] = true;
        ++nonce;
    }

     /**
     * @notice Check if the deadline has not expired.
     * @param _deadline The deadline timestamp to check.
     */
    function _checkDeadline(uint256 _deadline) internal view {
        require(_deadline >= block.timestamp, "Validator: Deadline expired");
    }

    /**
     * @notice Returns the hash for the given BuyTokensData.
     * @param _data BuyTokensData struct containing the data.
     * @return The hash of the given data.
     */
    function getBuyTokensHash(BuyTokensData memory _data) public view returns (bytes32) {
        return keccak256(abi.encodePacked(
            CACHED_DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                BUY_TOKENS_TYPE_HASH,
                _data.receiver,
                _data.paymentToken,
                _data.paymentAmount, 
                _data.amountOfCBCOINToPurchase, 
                _data.deadline, 
                _data.salt
            ))
        ));
    }

     /**
     * @notice Returns the hash for the given CreateCollectionData.
     * @param _data CreateCollectionData struct containing the data.
     * @return The hash of the given data.
     */
    function getCreateCollectionHash(CreateCollectionData memory _data) public view returns (bytes32) {
        return keccak256(abi.encodePacked(
            CACHED_DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                CREATE_TOLLECTION_TYPE_HASH,
                _data.brandName,
                _data.creator,
                _data.supplyLimit,
                _data.paymentAmount, 
                _data.deadline, 
                _data.salt
            ))
        ));
    }

    /**
     * @notice Validates the struct hash and checks if the required permits are present.
     * @dev Internal function to check permits for CreateCollection.
     * @param _data CreateCollectionData struct containing the data.
     * @param _signatures Array of signatures.
     * @return The number of verifications.
     */
    function _createCollectionValidateHashAndCheckPermit(
        CreateCollectionData memory _data,
        Signature[] memory _signatures
    ) internal returns (uint256) {
        _checkDeadline(_data.deadline);

        bytes32 _structHash = getCreateCollectionHash(_data);
        uint256 verifications = _validateHashAndCheckPermit(_structHash, _signatures);

        emit CreateCollectionValidated(_data, verifications);
        return verifications;
    }

     /**
     * @notice Validates the struct hash and checks if the required permits are present.
     * @dev Internal function to check permits for BuyTokens.
     * @param _data BuyTokensData struct containing the data.
     * @param _signatures Array of signatures.
     * @return The number of verifications.
     */
    function _buyTokensValidateHashAndCheckPermit(
        BuyTokensData memory _data,
        Signature[] memory _signatures
    ) internal returns (uint256) {
        _checkDeadline(_data.deadline);

        bytes32 _structHash = getBuyTokensHash(_data);
        uint256 verifications = _validateHashAndCheckPermit(_structHash, _signatures);

        emit BuyTokensValidated(_data, verifications);
        return verifications;
    }

    /**
     * @notice Validates the given hash and checks if the required permits are present.
     * @dev Internal function to check permits for a generic operation.
     * @param _hashData The hash to be validated.
     * @param _signatures Array of signatures.
     * @return The number of verifications.
     */
    function _validateHashAndCheckPermit(
        bytes32  _hashData,
        Signature[] memory _signatures
    ) internal returns (uint256) {
        _validateHash(_hashData);

        uint256 l = _signatures.length;
        address[] memory signers = new address[](l);

        for (uint256 i; i < l; ) {
            address _signer = ECDSA.recover(
                ECDSA.toEthSignedMessageHash(_hashData),
                _signatures[i].v,
                _signatures[i].r,
                _signatures[i].s
            );
            require(_verify(_signer), "Validator: Signer address is not validator");
            require(!duplicateExist[_signer], "Validator: Duplicated validator");

            signers[i] = _signer;
            duplicateExist[_signer] = true;

            emit ValidatedFrom(_hashData, _signer);
            unchecked { ++i; }
        }
        require(l >= minVerificationsCount, "Validator: Insufficient number of verifications");
        
        for (uint256 i; i < l; ) {
            delete duplicateExist[signers[i]];
            unchecked { ++i; }
        }

        return l;
    }

    /**
     * @notice Sets the minimum number of verifications required.
     * @dev Internal function to set the minimum verifications count.
     * @param _minVerificationsCount The new minimum verifications count.
     */
    function _setMinVerificationsCount(uint256 _minVerificationsCount) internal  {
        require(_minVerificationsCount > 0, "Validator: Min verifications count should be greater than 0");

        minVerificationsCount = _minVerificationsCount;
        emit SettedMinVerificationsCount(_minVerificationsCount);
    }

     /**
     * @notice Verifies if the recovered signer is a valid validator.
     * @dev Internal function to check if the given signer is a valid validator.
     * @param _recoveredSigner The recovered signer address.
     * @return True if the signer is a valid validator, false otherwise.
     */
    function _verify(address _recoveredSigner) internal view virtual returns (bool) {}
}