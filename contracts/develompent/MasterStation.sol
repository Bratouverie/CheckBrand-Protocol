// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MasterStation
 * @notice MasterStation is the main smart contract that manages brands, collections, roles, and assets.
 * It provides functionalities to create brands, collections, deploy collections, manage access control,
 * purchase CBCOIN tokens, and interact with other smart contracts in the ecosystem.
 */
import "./access/RolesControl.sol";
import "./access/roles/PlatformRoles.sol";
import "./access/roles/BrandRoles.sol";
import "./access/roles/CollectionRoles.sol";
import "./interfaces/token/ICollection.sol";
import "./interfaces/finance/IPayments.sol";
import "./interfaces/access/IValidator.sol";
import "./interfaces/IFactory.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MasterStation is 
    PlatformRoles, 
    BrandRoles, 
    CollectionRoles, 
    IValidator, 
    ICollectionData 
{
    using Address for address payable;
    using SafeERC20 for IERC20;
    using RolesControl for RolesControl.Asset;

    // Struct to store creation information about a collection
    struct CreatedCollection {
        address creator;
        uint256 supplyLimit;
    }

    // Struct to store information about a collection
    struct Collection {
        RolesControl.Asset collectionRoles;
        bool exist;
    }

    // Struct to store information about a brand
    struct Brand {
        RolesControl.Asset brandRoles;
        CreatedCollection[] createdCollections;

        address[] deployedCollections;
        mapping(address => Collection) deployedCollection;
    }

    IFactory public factory;
    IPayments public paymentsContract;
    IERC20 public CBCOIN;

    mapping(address => bool) public isValidator;
    address[] public validators;
    mapping(address => uint256) public validatorIdx;

    mapping(string => bool) public isBrandExist;
    mapping(address => bool) public isCollectionEnabled;

    string[] public brands;
    mapping(string => Brand) private brand;
    RolesControl.Asset private platformRoles;

    // Events
    event PaymentsContractSetted(address indexed previousAddress, address indexed actualAddress);
    event CBCOINContractSetted(address indexed previousAddress, address indexed actualAddress);
    event FactorySetted(address indexed previousAddress, address indexed actualAddress);

    event BrandCreated(string indexed name, address indexed initAdmin, uint256 timestamp);
    event CollectionCreated(string indexed brandName, address indexed creator, uint256 supplyLimit);
    event CollectionDeployed(string indexed brandName, address indexed deployer, uint256 supplyLimit, address collectionAddress);

    event CollectionDisabled(string indexed brandName, address indexed collectionAddress, address indexed account);
    event CollectionEnabled(string indexed brandName, address indexed collectionAddress, address indexed account);

    event PlatformRoleGranted(uint8 indexed role, address indexed account, address indexed sender);
    event PlatformRoleRevoked(uint8 indexed role, address indexed account, address indexed sender);
    event BrandRoleGranted(string indexed brandName, uint8 indexed role, address indexed account, address sender);
    event BrandRoleRevoked(string indexed brandName, uint8 indexed role, address indexed account, address sender);
    event CollectionRoleGranted(string indexed brandName, address indexed collectionAddress, uint8 indexed role, address account, address sender);
    event CollectionRoleRevoked(string indexed brandName, address indexed collectionAddress, uint8 indexed role, address account, address sender);
    event ValidatorRoleGranted(address indexed account, address indexed sender);
    event ValidatorRoleRevoked(address indexed account, address indexed sender);

    // Fallback function to receive payments
    receive() external payable {
        require(msg.sender == address(paymentsContract), "MasterStation: Payments only");
    }

    // Modifier to prevent self-revoke actions
    modifier notSelf(address account) {
        require(msg.sender != account, "MasterStation: Cant self-revoke");
        _;
    }

    /**
     * @notice Constructor of MasterStation.
     * @param _defaultAdmin The default admin's address
     * @param _chiefAdmin The chief admin's address
     */
    constructor(
        address _defaultAdmin,
        address _chiefAdmin
    ) {
        platformRoles._grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        platformRoles._grantRole(CHIEF_ADMIN_ROLE, _chiefAdmin);
    }

    /**
     * @notice Private function to create a new brand.
     * @param _brand The name of the new brand
     * @param _initAdmin The initial admin's address
     */
    function createBrand(
        string calldata _brand, 
        address _initAdmin
    ) private {
        require(!isBrandExist[_brand], "MasterStation: Brand already exist");

        isBrandExist[_brand] = true;
        brands.push(_brand);
        brand[_brand].brandRoles._grantRole(BRAND_ADMIN_ROLE, _initAdmin);

        emit BrandCreated(_brand, _initAdmin, block.timestamp);
    }

    /**
     * @notice Function to create a collection.
     * @param _data The data required to create a collection
     * @param _signature Array of validator signatures
     */
    function createCollection(
        IPayments.CreateCollectionData calldata _data, 
        IPayments.Signature[] calldata _signature
    ) external {
        require(_data.creator == msg.sender, "MasterStation: Incorrect sender");

        if (!isBrandExist[_data.brandName]) createBrand(_data.brandName, msg.sender);
        checkAccessToBrand(_data.brandName, BRAND_ADMIN_ROLE, msg.sender);

        CBCOIN.safeTransferFrom(msg.sender, address(this), _data.paymentAmount);
        CBCOIN.safeApprove(address(paymentsContract), _data.paymentAmount);

        require(
            paymentsContract.paymentForTheCreationOfACollection(_data, _signature),
            "MasterStation: Payment failed"
        );

        brand[_data.brandName].createdCollections.push(CreatedCollection({
            creator: msg.sender,
            supplyLimit: _data.supplyLimit
        }));
        emit CollectionCreated(_data.brandName, msg.sender, _data.supplyLimit);
    }

    /**
     * @notice Function to deploy a collection.
     * @param _brand The name of the brand
     * @param collectionIndex The index of the created collection
     * @param _data The data required to deploy a collection
     */
    function deployCollection(
        string calldata _brand, 
        uint256 collectionIndex, 
        CollectionData calldata _data
    ) external {
        require(
            brand[_brand].createdCollections.length > collectionIndex, 
            "MasterStation: Non-existent collection"
        );
        CreatedCollection memory collection = brand[_brand].createdCollections[collectionIndex];

        require(collection.creator == msg.sender, "MasterStation: Incorrect deployer");
        checkAccessToBrand(_brand, BRAND_ADMIN_ROLE, msg.sender);

        address _deployedCollection = factory.deployCollection(
            _brand, 
            collection.creator, 
            collection.supplyLimit, 
            _data
        );
        brand[_brand].deployedCollections.push(_deployedCollection);
        brand[_brand].deployedCollection[_deployedCollection].exist = true;

        uint256 lastIdx = brand[_brand].createdCollections.length - 1;
        brand[_brand].createdCollections[collectionIndex] = brand[_brand].createdCollections[lastIdx];
        brand[_brand].createdCollections.pop();

        isCollectionEnabled[_deployedCollection] = true;
        emit CollectionDeployed(_brand, msg.sender, collection.supplyLimit, _deployedCollection);
    }

    /**
     * @notice Function to purchase CBCOIN tokens with another ERC20 token.
     * @param _data The data required to purchase CBCOIN tokens
     * @param _signature Array of validator signatures
     */
    function purchaseCBCOINWithToken(
        BuyTokensData calldata _data,
        Signature[] calldata _signature
    ) external {
        IERC20(_data.paymentToken).safeTransferFrom(msg.sender, address(this), _data.paymentAmount);
        IERC20(_data.paymentToken).safeApprove(address(paymentsContract), _data.paymentAmount);
        paymentsContract.purchaseCBCOINWithToken(_data, _signature);
    }

    /**
     * @notice Function to purchase CBCOIN tokens with ETH.
     * @param _data The data required to purchase CBCOIN tokens
     * @param _signature Array of validator signatures
     */
    function purchaseCBCOINWithETH(
        BuyTokensData calldata _data,
        Signature[] calldata _signature
    ) external payable {
        uint256 residue = paymentsContract.purchaseCBCOINWithETH{value: msg.value}(_data, _signature);
        if (residue > 0) {
            payable(msg.sender).sendValue(residue);
        }
    }

    /**
     * @notice Function to set the payments contract.
     * @param _paymentsContract The address of the new payments contract
     */
    function setPaymentsContract(
        IPayments _paymentsContract
    ) external {
        checkAccessToPlatform(DEFAULT_ADMIN_ROLE, msg.sender);

        emit PaymentsContractSetted(address(paymentsContract), address(_paymentsContract));
        paymentsContract = _paymentsContract;
    }

    /**
     * @notice Function to set the CBCOIN contract.
     * @param _cbcoin The address of the new CBCOIN contract
     */
    function setCBCOIN(
        IERC20 _cbcoin
    ) external {
        checkAccessToPlatform(DEFAULT_ADMIN_ROLE, msg.sender);

        emit CBCOINContractSetted(address(CBCOIN), address(_cbcoin));
        CBCOIN = _cbcoin;
    }

    /**
     * @notice Function to set the factory contract.
     * @param _factory The address of the new factory contract
     */
    function setFactory(
        IFactory _factory
    ) external {
        checkAccessToPlatform(DEFAULT_ADMIN_ROLE, msg.sender);

        emit FactorySetted(address(factory), address(_factory));
        factory = _factory;
    }

    /**
     * @notice Function to disable a collection.
     * @param _brand The name of the brand
     * @param _collection The address of the collection to be disabled
     */
    function disableCollection(string calldata _brand, address _collection) external {
        checkCollectionByBrand(_brand, _collection);
        require(
            msg.sender == ICollection(_collection).owner(),
            "MasterStation: Collection owner only"
        );
        _batchRevokeFromCollection(
            _brand, 
            _collection, 
            COLLECTION_ADMIN_ROLE,
            listCollectionAdmins(_brand, _collection)
        );
        _batchRevokeFromCollection(
            _brand, 
            _collection, 
            LIST_MODERATOR_ROLE,
            listCollectionModerators(_brand, _collection)
        );
        isCollectionEnabled[_collection] = false;
        emit CollectionDisabled(_brand, _collection, msg.sender);
    }

    /**
     * @notice Function to enable a collection.
     * @param _brand The name of the brand
     * @param _collection The address of the collection to be enabled
     */
    function enableCollection(string calldata _brand, address _collection) external {
        checkCollectionByBrand(_brand, _collection);
        require(
            msg.sender == ICollection(_collection).owner(),
            "MasterStation: Collection owner only"
        );
        isCollectionEnabled[_collection] = true;
        emit CollectionEnabled(_brand, _collection, msg.sender);
    }

    /**
     * @notice Private function to batch revoke roles from a collection.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @param _role The role to be revoked
     * @param _accounts Array of accounts to revoke the role from
     */
    function _batchRevokeFromCollection(
        string calldata _brand,
        address _collection,
        uint8 _role,
        address[] memory _accounts
    ) private {
        uint256 l = _accounts.length;
        for (uint256 i; i < l; ) {
            brand[_brand].deployedCollection[_collection].collectionRoles._revokeRole(_role, _accounts[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Function to check if an account has access to platform.
     * @param _role The role to check for access
     * @param _account The address of the account
     * @return bool True if the account has access, False otherwise
     */
    function hasAccessToPlatform(
        uint8 _role, 
        address _account
    ) external view returns (bool) {
        return _hasAccess(_role, _account);
    }

    /**
     * @notice Function to check if an account has access to a brand.
     * @param _brand The name of the brand
     * @param _role The role to check for access
     * @param _account The address of the account
     * @return bool True if the account has access, False otherwise
     */
    function hasAccessToBrand(
        string calldata _brand, 
        uint8 _role, 
        address _account
    ) external view returns (bool) {
        return _hasAccess(_brand, _role, _account);
    }

    /**
     * @notice Function to check if an account has access to a collection.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @param _role The role to check for access
     * @param _account The address of the account
     * @return bool True if the account has access, False otherwise
     */
    function hasAccessToCollection(
        string calldata _brand, 
        address _collection,
        uint8 _role, 
        address _account
    ) external view returns (bool) {
        return _hasAccess(_brand, _collection, _role, _account);
    }

    /**
     * @notice Private function to check if an account has access to a collection.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @param _role The role to check for access
     * @param _account The address of the account
     * @return bool True if the account has access, False otherwise
     */
    function _hasAccess(
        string calldata _brand, 
        address _collection, 
        uint8 _role, 
        address _account
    ) private view returns (bool) {
        if (
            !brand[_brand].deployedCollection[_collection].exist ||
            !isCollectionEnabled[_collection]
        ) {
            return false;
        }
        return  ICollection(_collection).owner() == _account ||
                _hasAccess(_brand, _role, _account) ||
                brand[_brand].deployedCollection[_collection].collectionRoles.hasAccess(_role, _account);
    }

    /**
     * @notice Private function to check if an account has access to a brand.
     * @param _brand The name of the brand
     * @param _role The role to check for access
     * @param _account The address of the account
     * @return bool True if the account has access, False otherwise
     */
    function _hasAccess(
        string calldata _brand, 
        uint8 _role, 
        address _account
    ) private view returns (bool) {
        require(isBrandExist[_brand], "MasterStation: Non-existent brand");
        return  _hasAccess(_role, _account) ||
                brand[_brand].brandRoles.hasAccess(_role, _account);
    }

    /**
     * @notice Private function to check if an account has access to the platform.
     * @param _role The role to check for access
     * @param _account The address of the account
     * @return bool True if the account has access, False otherwise
     */
    function _hasAccess(
        uint8 _role, 
        address _account
    ) private view returns (bool) {
        return platformRoles.hasAccess(_role, _account);
    }

    /**
     * @notice Function to grant validator role to an account.
     * @param _account The address of the account to grant the role
     */
    function grantValidatorRole(
        address _account
    ) external {
        require(!isValidator[_account], "MasterStation: Already validator");
        platformRoles._checkRole(DEFAULT_ADMIN_ROLE);

        isValidator[_account] = true;
        validatorIdx[_account] = validators.length;
        validators.push(_account);
        emit ValidatorRoleGranted(_account, msg.sender);
    }

    /**
     * @notice Function to revoke validator role from an account.
     * @param _account The address of the account to revoke the role
     */
    function revokeValidatorRole(
        address _account
    ) external {
        require(isValidator[_account], "MasterStation: Already not validator");
        platformRoles._checkRole(DEFAULT_ADMIN_ROLE);

        isValidator[_account] = false;
        uint256 idx = validatorIdx[_account];
        uint256 lastIdx = validators.length - 1;
        validators[idx] = validators[lastIdx];
        validatorIdx[validators[lastIdx]] = idx;
        validators.pop();
        emit ValidatorRoleRevoked(_account, msg.sender);
    }

    /**
     * @notice Function to grant platform admin role to an account.
     * @param _account The address of the account to grant the role
     */
    function grantPlatformAdminRole(
        address _account
    ) external {
        platformRoles.grantRole(PLATFORM_ADMIN_ROLE, _account);
        emit PlatformRoleGranted(PLATFORM_ADMIN_ROLE, _account, msg.sender);
    }

    function revokePlatformAdminRole(
        address _account
    ) external notSelf(_account) {
        platformRoles.revokeRole(PLATFORM_ADMIN_ROLE, _account);
        emit PlatformRoleRevoked(PLATFORM_ADMIN_ROLE, _account, msg.sender);
    }

    /**
     * @notice Function to grant brand admin role to an account.
     * @param _brand The name of the brand
     * @param _account The address of the account to grant the role
     */
    function grantBrandAdminRole(
        string calldata _brand, 
        address _account
    ) external {
        checkAccessToBrand(_brand, RolesControl.getRoleAdmin(BRAND_ADMIN_ROLE), msg.sender);
        brand[_brand].brandRoles._grantRole(BRAND_ADMIN_ROLE, _account);
        emit BrandRoleGranted(_brand, BRAND_ADMIN_ROLE, _account, msg.sender);
    }
    
    /**
     * @notice Function to revoke brand admin role from an account.
     * @param _brand The name of the brand
     * @param _account The address of the account to grant the role
     */
    function revokeBrandAdminRole(
        string calldata _brand, 
        address _account
    ) external notSelf(_account) {
        checkAccessToBrand(_brand, RolesControl.getRoleAdmin(BRAND_ADMIN_ROLE), msg.sender);
        brand[_brand].brandRoles._revokeRole(BRAND_ADMIN_ROLE, _account);
        emit BrandRoleRevoked(_brand, BRAND_ADMIN_ROLE, _account, msg.sender);
    }

    /**
     * @notice Function to grant collection admin role to an account.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @param _account The address of the account to grant the role
     */
    function grantCollectionAdminRole(
        string calldata _brand, 
        address _collection, 
        address _account
    ) external {
        checkAccessToCollection(
            _brand, 
            _collection, 
            RolesControl.getRoleAdmin(COLLECTION_ADMIN_ROLE), 
            msg.sender
        );
        brand[_brand].deployedCollection[_collection].collectionRoles._grantRole(
            COLLECTION_ADMIN_ROLE,
            _account
        );
        emit CollectionRoleGranted(_brand, _collection, COLLECTION_ADMIN_ROLE, _account, msg.sender);
    }

    /**
     * @notice Function to revoke collection admin role from an account.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @param _account The address of the account to grant the role
     */
    function revokeCollectionAdminRole(
        string calldata _brand, 
        address _collection, 
        address _account
    ) external notSelf(_account) {
        checkAccessToCollection(
            _brand, 
            _collection, 
            RolesControl.getRoleAdmin(COLLECTION_ADMIN_ROLE), 
            msg.sender
        );
        brand[_brand].deployedCollection[_collection].collectionRoles._revokeRole(
            COLLECTION_ADMIN_ROLE,
            _account
        );
        emit CollectionRoleRevoked(_brand, _collection, COLLECTION_ADMIN_ROLE, _account, msg.sender);
    }

    /**
     * @notice Function to grant collection moderator role to an account.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @param _account The address of the account to grant the role
     */
    function grantCollectionModeratorRole(
        string calldata _brand, 
        address _collection, 
        address _account
    ) external {
        checkAccessToCollection(
            _brand, 
            _collection, 
            RolesControl.getRoleAdmin(LIST_MODERATOR_ROLE), 
            msg.sender
        );
        brand[_brand].deployedCollection[_collection].collectionRoles._grantRole(
            LIST_MODERATOR_ROLE,
            _account
        );
        emit CollectionRoleGranted(_brand, _collection, LIST_MODERATOR_ROLE, _account, msg.sender);
    }

    /**
     * @notice Function to revoke collection moderator role from an account.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @param _account The address of the account to grant the role
     */
    function revokeCollectionModeratorRole(
        string calldata _brand, 
        address _collection, 
        address _account
    ) external notSelf(_account) {
        checkAccessToCollection(
            _brand, 
            _collection, 
            RolesControl.getRoleAdmin(LIST_MODERATOR_ROLE), 
            msg.sender
        );
        brand[_brand].deployedCollection[_collection].collectionRoles._revokeRole(
            LIST_MODERATOR_ROLE,
            _account
        );
        emit CollectionRoleRevoked(_brand, _collection, LIST_MODERATOR_ROLE, _account, msg.sender);
    }

    /**
     * @notice Function to check if a collection belongs to a brand.
     * @dev The function will return an error if the collection does not belong to a brand
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     */
    function checkCollectionByBrand(
        string calldata _brand, 
        address _collection
    ) public view {
        require(
            brand[_brand].deployedCollection[_collection].exist, 
            "MasterStation: Brand does not have this collection"
        );
    }

    /**
     * @notice The function checks if the user has the platform role.
     * @dev The function will return an error if the user does not have the given role or higher
     * @param _role The number of the role
     * @param _account The address of the account to check the role
     */
    function checkAccessToPlatform(
        uint8 _role, 
        address _account
    ) public view {
        require(
            _hasAccess(_role, _account), 
            "MasterStation: Not have access to the platform"
        );
    }

    /**
     * @notice The function checks if the user has the brand role.
     * @dev The function will return an error if the user does not have the given role or higher
     * @param _role The number of the role
     * @param _account The address of the account to check the role
     */
    function checkAccessToBrand(
        string calldata _brand, 
        uint8 _role, 
        address _account
    ) public view {
        require(
            _hasAccess(_brand, _role, _account), 
            "MasterStation: Not have access to the brand"
        );
    }

    /**
     * @notice The function checks if the user has the collection role.
     * @dev The function will return an error if the user does not have the given role or higher
     * @param _role The number of the role
     * @param _account The address of the account to check the role
     */
    function checkAccessToCollection(
        string calldata _brand, 
        address _collection, 
        uint8 _role, 
        address _account
    ) public view {
        require(
            _hasAccess(_brand, _collection, _role, _account), 
            "MasterStation: Not have access to the collection"
        );
    }

    /**
     * @notice The function returns DEFAULT_ADMIN_ROLE addresses.
     * @return The array of addresses
     * @dev Returns an array, but it will always have one value
     */
    function listDefaultAdmins() external view returns (address[] memory) {
        return platformRoles.listAssetRoleMembers(DEFAULT_ADMIN_ROLE);
    }

    /**
     * @notice The function returns CHIEF_ADMIN_ROLE addresses.
     * @return The array of addresses
     * @dev Returns an array, but it will always have one value
     */
    function listChiefAdmins() external view returns (address[] memory) {
        return platformRoles.listAssetRoleMembers(CHIEF_ADMIN_ROLE);
    }

    /**
     * @notice The function returns PLATFORM_ADMIN_ROLE addresses.
     * @return The array of addresses
     */
    function listPlatformAdmins() external view returns (address[] memory) {
        return platformRoles.listAssetRoleMembers(PLATFORM_ADMIN_ROLE);
    }

    /**
     * @notice The function returns BRAND_ADMIN_ROLE addresses.
     * @param _brand The name of the brand
     * @return The array of addresses
     */
    function listBrandAdmins(
        string calldata _brand
    ) external view returns (address[] memory) {
        return brand[_brand].brandRoles.listAssetRoleMembers(BRAND_ADMIN_ROLE);
    }

    /**
     * @notice The function returns BRAND_ADMIN_ROLE addresses.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @return The array of addresses
     */
    function listCollectionAdmins(
        string calldata _brand,
        address _collection
    ) public view returns (address[] memory) {
        return brand[_brand].deployedCollection[_collection].collectionRoles.listAssetRoleMembers(
            COLLECTION_ADMIN_ROLE
        );
    }

    /**
     * @notice The function returns LIST_MODERATOR_ROLE addresses.
     * @param _brand The name of the brand
     * @param _collection The address of the collection
     * @return The array of addresses
     */
    function listCollectionModerators(
        string calldata _brand,
        address _collection
    ) public view returns (address[] memory) {
        return brand[_brand].deployedCollection[_collection].collectionRoles.listAssetRoleMembers(
            LIST_MODERATOR_ROLE
        );
    }

    /**
     * @notice The function returns Validators addresses.
     * @return The array of addresses
     */
    function listValidators() external view returns (address[] memory) {
        return validators;
    }

    /**
     * @notice The function returns deployed collections addresses.
     * @param _brand The name of the brand
     * @return The array of addresses
     */
    function listDeployedBrandCollections(
        string calldata _brand
    ) external view returns (address[] memory) {
        return brand[_brand].deployedCollections;
    }

    /**
     * @notice The function returns created collections structs.
     * @param _brand The name of the brand
     * @return The array of CreatedCollection structs
     */
    function listCreatedBrandCollections(
        string calldata _brand
    ) external view returns (CreatedCollection[] memory) {
        return brand[_brand].createdCollections;
    }

    /**
     * @notice The function returns created brands.
     * @return The array of created brands names
     */
    function listBrands() external view returns (string[] memory) {
        return brands;
    }
}