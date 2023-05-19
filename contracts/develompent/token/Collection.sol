// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../access/Ownable.sol";
import "../access/roles/BrandRoles.sol";
import "../access/roles/CollectionRoles.sol";
import "../cryptography/MerkleTree.sol";

import "../interfaces/IMasterStation.sol";
import "../interfaces/token/ICollectionData.sol";

// Collection contract
// The Collection contract is an NFTs minting and management contract that utilizes
// ERC721Enumerable and ERC2981 for NFT creation, metadata management, and royalty support.
// It also includes access control with BrandRoles and CollectionRoles.
//
// Collection contract-features include minting, batch minting, royalty settings,  
// token URI configuration, minting whitelist and booking system, and withdrawal of earnings.

contract Collection is 
    Ownable, 
    BrandRoles,
    CollectionRoles, 
    ERC2981, 
    ERC721Enumerable, 
    ReentrancyGuard, 
    ICollectionData 
{
    using Address for address payable;
    using SafeERC20 for IERC20;
    using MerkleTree for MerkleTree.MerkleData;
    using Strings for uint256;

    // bytes32(bytes(abi.encodePacked("whitelist")));
    bytes32 public constant WHITELIST_ADDITION = 
        0x77686974656c6973740000000000000000000000000000000000000000000000;
    address public constant ADMINS_BOOKING_ADDRESS = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
    uint256 public constant DEFAULT_LIMIT = 1;
    uint96 public constant EARNINGS_LIMIT = 1000;  // 10%
    uint96 public constant DENOMINATOR = 10000;  // 100%

    IMasterStation public masterStation;
    string public ownedByBrand;
    
    // bytes32 type variable containing the root hash of the merkle tree used to instantiate
    // the MerkleData structure for minting whitelisted tokens.
    /* 
     * stores keccak256(abi.encode(address,uint256))

        keccak256(abi.encode(
            address receiver,
            uint256 mintLimit
        ));
     */
    MerkleTree.MerkleData public whitelist;  

    // bytes32 type variable containing the root hash of the merkle tree used to instantiate
    // the MerkleData structure for minting booked tokens.
    /* 
     * stores keccak256(abi.encode(address,uint256,bytes32,bytes32,bytes32))

        keccak256(abi.encode(
            address receiver,
            uint256 tokenId,
            keccak256(abi.encode(
                address[] creators,
                uint96[] fees,
                uint96 investorFee
            )),
            keccak256(abi.encode(
                address paymentToken,
                uint256 paymentAmount
            )),
            keccak256(abi.encode(
                address[] paymentReceivers,
                uint96[] receiversShares
            ))
        ));
     */
    MerkleTree.MerkleData public bookingList; 

    // A mapping to keep track of the number of NFTs minted by an account in public mint stage
    mapping(address => uint256) public publicMintsCounter;

    // The maximum number of NFTs allowed for minting 
    uint256 public supplyLimit;
    // The limit of NFTs that can be minted per account during the public mint stage.
    uint256 public publicMintTokensLimit;
     // Percentage of earnings for the tokens.
    uint96 public earnings;

    // The current minting stage.
    MintStage public mintStage;

     // Metadata variables.
    string private baseURI_;
    string private _name;
    string private _symbol;
    
    // RoyaltyReceiver struct is used to handle royalty payments related to any specific NFT.
    struct RoyaltyReceiver {
        bytes32 senderHash;
        uint256 receivedAmount;
        uint256 tokenId;
        bool isTokenTransfered;
    }

    RoyaltyReceiver private royaltyReceiver;

    // FeeReceiver struct is used to specify a fee receiver address and the fee percentage.
    struct FeeReceiver {
        address account;
        uint96 fee;
    }

    // RoyaltyStorage struct is used to store the investor's and the creator's royalty information.
    struct RoyaltyStorage {
        FeeReceiver investor;
        FeeReceiver[] creators;
    }

    // Mapping to store tokenId and its corresponding RoyaltyStorage.
    mapping(uint256 => RoyaltyStorage) private tokenRoyalty;

    bool private _initialized;

     // This struct stores the configuration settings required for royalties on minted tokens.
    struct InputRoyaltySettings {
        uint96 investorFee;
        address[] creators;
        uint96[] creatorsFees;
    }

     // This struct stores the configuration settings required for payment distribution when minting tokens.
    struct InputPaymentSettings {
        address paymentToken;
        uint256 paymentAmount;
        address[] paymentReceivers;
        uint96[] receiversShares;
    }

    // Events
    event WhitelistUpdated(address indexed sender, bytes32 indexed previousMerkleRoot, bytes32 indexed actualMerkleRoot);
    event BookingListUpdated(address indexed sender, bytes32 indexed previousMerkleRoot, bytes32 indexed actualMerkleRoot);
    event MintStageChanged(address indexed sender, MintStage indexed previousMintStage, MintStage indexed actualMintStage);

    event AdminBookedTokenMinted(address indexed sender, address indexed receiver, uint256 indexed tokenId);
    event BookedTokenMinted(address indexed sender, address indexed receiver, uint256 indexed tokenId);
    event WhitelistedTokenMinted(address indexed receiver, uint256 indexed tokenId);
    event PublicTokenMinted(address indexed receiver, uint256 indexed tokenId);

    event RoyaltySetted(uint256 indexed token, address indexed investor, uint96 investorFee, address[] creators, uint96[] creatorsFees);
    event CreatorsRoyaltyChanged(uint256 indexed token, address[] creators, uint96[] creatorsFees);

    event PaymentDistributed(uint256 indexed token, uint256 paymentAmount, address[] receivers, uint96[] shares);
    event RoyaltySended(uint256 indexed token, address indexed receiver, uint256 amount);

    event PublicMintTokensLimitUpdated(uint256 indexed previousLimit, uint256 indexed actualLimit);

    event Withdrawn(address indexed to, address indexed token, uint256 amount);

    /**
     * @dev Modifier that ensures the mint functionality is enabled.
     * Reverts if the mintStage is equal to 0 (MintStage.DISABLED).
     */
    modifier isMintEnabled() {
        require(uint8(mintStage) > 0, "Collection: Mint disabled now");
        _;
    }

    /**
     * @dev Modifier that performs a payment control check before token minting.
     * Reverts if both ETH and another payment token are sent together.
     * At the end of calling function, refunds any excess ETH sent by the user.
     * @param paymentSettings InputPaymentSettings structure containing the payment configuration.
     */
    modifier paymentControl(InputPaymentSettings calldata paymentSettings) {
        require(
            paymentSettings.paymentToken == address(0) || msg.value == 0, 
            "Collection: ETH is not required"
        );
        _;
        if (
            paymentSettings.paymentToken == address(0) &&
            msg.value > paymentSettings.paymentAmount
        ) {
            payable(_msgSender()).sendValue(msg.value - paymentSettings.paymentAmount);
        }
    }
    
    /**
     * @dev Receive function is called when a user sends ether to the contract.
     * If the received amount is greater than 0, royaltyReceiver's receivedAmount is increased.
     * If the token is already transferred, royalty will be sent.
     */
    receive() external payable {
        if (msg.value == 0) return;

        _checkSenderHash();

        royaltyReceiver.receivedAmount += msg.value;
        if (royaltyReceiver.isTokenTransfered) {
            _sendRoyalty();
        }
    }

    /**
     * @dev Constructor to initialize an instance of Collection.
     */
    constructor() ERC721("", "") {}

    /**
     * @dev Initialize function to set up the collection and its properties.
     * Can only be called once, verifies the earnings limit.
     * Initializes multiple contract properties and sets the initial mint stage.
     * @param _masterStation A MasterStation contract instance.
     * @param _brand A string representing the brand associated with the collection.
     * @param _creator The address of the contract creator/owner.
     * @param _supplyLimit The maximum allowed supply of NFTs for this collection.
     * @param _data CollectionData struct with the metadata and settings required for the collection.
     */
    function initialize(
        IMasterStation _masterStation,
        string memory _brand,
        address _creator, 
        uint256 _supplyLimit,
        CollectionData memory _data
    ) public {
        require(!_initialized, "Collection: Initialization only");
        require(_data.earnings <= EARNINGS_LIMIT, "Collection: Earnings limit exceeded");

        _initialized = true;

        __init_Ownable(_creator);
        _setDefaultRoyalty(address(this), _data.earnings);
        supplyLimit = _supplyLimit;
        masterStation = _masterStation;

        ownedByBrand = _brand;
        earnings = _data.earnings;
        _name = _data.name;
        _symbol = _data.symbol;
        baseURI_ = _data.baseURI;
        whitelist.update(_data.whitelist);
        bookingList.update(_data.bookingList);
        publicMintTokensLimit = _data.publicMintTokensLimit;
        mintStage = _data.mintStage;
    }

    /**
     * @dev Checks if the given `interfaceId` is supported by this contract instance.
     * Overrides the {ERC721Enumerable.supportsInterface} and {ERC2981.supportsInterface}
     * function to achieve this functionality.
     *
     * @param interfaceId The ERC165 interface id.
     * @return `true` if the given `interfaceId` is supported, `false` otherwise.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Modifier to restrict minting and other functions to only accounts with access or the owner.
     * It requires the `masterStation` to return `true` for access to the Collection or being the owner of the contract.
     */
    modifier accessOnly() {
        require(
            masterStation.hasAccessToCollection(
                ownedByBrand, 
                address(this), 
                LIST_MODERATOR_ROLE, 
                _msgSender()
            ) || isOwner(_msgSender()),
            "Collection: No access"
        );
        _;
    }

    /**
     * @dev Updates the public mint token limit.
     *
     * Requirements:
     * - Caller must have access to the collection or be the owner.
     *
     * @param _publicMintTokensLimit The new public mint token limit.
     */
    function updatePublicMintTokensLimit(
        uint256 _publicMintTokensLimit
    ) external accessOnly {
        emit PublicMintTokensLimitUpdated(publicMintTokensLimit, _publicMintTokensLimit);
        publicMintTokensLimit = _publicMintTokensLimit;
    }

    /**
     * @dev Updates the merkle tree roots and the mint stage of the collection.
     *
     * Requirements:
     * - Caller must have access to the collection or be the owner.
     *
     * @param whitelistHash The new Merkle tree root hash for the whitelist.
     * @param bookingHash The new Merkle tree root hash for the booking list.
     * @param _mintStage The new mint stage.
     */
    function updateTreesAndMintStage(
        bytes32 whitelistHash, 
        bytes32 bookingHash, 
        MintStage _mintStage
    ) external accessOnly {
        address sender = _msgSender();

        emit BookingListUpdated(sender, bookingList.getRoot(), bookingHash);
        emit WhitelistUpdated(sender, whitelist.getRoot(), whitelistHash);
        emit MintStageChanged(sender, mintStage, _mintStage);
        
        bookingList.update(bookingHash);
        whitelist.update(whitelistHash);
        mintStage = _mintStage;
    }

    /**
     * @notice Mint a token with the given tokenId, mintLimit, bookingProof, whitelistProof,
     * royaltySettings, and paymentSettings.
     * @param tokenId The unique token ID to mint.
     * @param mintLimit The maximum number of allowed mint events.
     * @param bookingProof An array of booking proof hash elements.
     * @param whitelistProof An array of whitelist proof hash elements.
     * @param royaltySettings A structure containing royalty data, such as investorFee, creators, and creatorsFees.
     * @param paymentSettings A structure containing payment data, such as paymentToken, paymentAmount, paymentReceivers, and receiversShares.
     * This function calls _mintTo() function internally to handle the minting process.
     */
    function mint(
        uint256 tokenId, 
        uint256 mintLimit, 
        bytes32[] calldata bookingProof, 
        bytes32[] calldata whitelistProof, 
        InputRoyaltySettings calldata royaltySettings,
        InputPaymentSettings calldata paymentSettings
    ) external payable nonReentrant paymentControl(paymentSettings) {
        _mintTo(
            _msgSender(), 
            tokenId, 
            mintLimit,
            bookingProof, 
            whitelistProof, 
            royaltySettings,
            paymentSettings,
            0
        );
    }

    /**
     * @notice Mint a token with a given tokenId, bookingProof, royaltySettings, and paymentSettings to the specified receiver.
     * @param receiver The address that will receive the minted token.
     * @param tokenId The unique token ID to mint.
     * @param bookingProof An array of booking proof hash elements.
     * @param royaltySettings A structure containing royalty data, such as investorFee, creators, and creatorsFees.
     * @param paymentSettings A structure containing payment data, such as paymentToken, paymentAmount, paymentReceivers, and receiversShares.
     * This function calls _mintTo() function internally to check if the sender has rights to mint and handles the minting process.
     */
    function mintTo(
        address receiver, 
        uint256 tokenId, 
        bytes32[] calldata bookingProof,
        InputRoyaltySettings calldata royaltySettings,
        InputPaymentSettings calldata paymentSettings
    ) external payable nonReentrant paymentControl(paymentSettings) {
        require(_mintTo(
            receiver,
            tokenId, 
            bookingProof,
            royaltySettings,
            paymentSettings,
            0
        ), "Collection: No rights to mint");
    }

     /**
     * @dev Private function to mint token with various checks and conditions.
     * @param receiver - Address of the receiver of the minted token.
     * @param tokenId - Unique identifier of the token to be minted.
     * @param bookingProof - An array of booking proofs.
     * @param royaltySettings - Struct containing information related to royalties.
     * @param paymentSettings - Struct containing information related to payments.
     * @param debt - Debt of a user (already payed value).
     * @return true if the token is minted successfully, otherwise false.
     */
    function _mintTo(
        address receiver, 
        uint256 tokenId, 
        bytes32[] calldata bookingProof,
        InputRoyaltySettings calldata royaltySettings,
        InputPaymentSettings calldata paymentSettings,
        uint256 debt
    ) private isMintEnabled returns (bool) {
        require(!_exists(tokenId), "Collection: Token already minted");

        {
        uint256 l = royaltySettings.creators.length;
        require(l == royaltySettings.creatorsFees.length, "Collection: Incorrect arrays length");
        
        RoyaltyStorage storage token = tokenRoyalty[tokenId];
        uint96 totalFee = royaltySettings.investorFee;
        for(uint256 i; i < l; ) {
            require(royaltySettings.creators[i] != address(0), "Collection: Zero address");

            token.creators.push(FeeReceiver(
                royaltySettings.creators[i], 
                royaltySettings.creatorsFees[i]
            ));
            totalFee += royaltySettings.creatorsFees[i];

            unchecked { ++i; }
        }

        require(totalFee == earnings, "Collection: Earnings exceeded");
        token.investor.account = receiver;
        token.investor.fee = royaltySettings.investorFee;

        emit RoyaltySetted(
            tokenId,
            receiver,
            royaltySettings.investorFee,
            royaltySettings.creators,
            royaltySettings.creatorsFees
        );
        }

        if (paymentSettings.paymentAmount > 0) {
            bool isETH = paymentSettings.paymentToken == address(0);
            if (isETH) {
                require(msg.value >= debt + paymentSettings.paymentAmount, "Collection: Not enough ETH");
            } else {
                IERC20(paymentSettings.paymentToken).safeTransferFrom(
                    _msgSender(), 
                    address(this), 
                    paymentSettings.paymentAmount
                );
            }

            uint256 l = paymentSettings.paymentReceivers.length;
            require(l == paymentSettings.receiversShares.length, "Collection: Incorrect arrays length");

            uint96 totalFee;
            for(uint256 i; i < l; ) {
                require(paymentSettings.paymentReceivers[i] != address(0), "Collection: Zero address");
                totalFee += paymentSettings.receiversShares[i];
                
                if (isETH) {
                    payable(paymentSettings.paymentReceivers[i]).sendValue(
                        paymentSettings.paymentAmount * paymentSettings.receiversShares[i] / DENOMINATOR
                    );
                } else {
                    IERC20(paymentSettings.paymentToken).safeTransfer(
                        paymentSettings.paymentReceivers[i], 
                        paymentSettings.paymentAmount * paymentSettings.receiversShares[i] / DENOMINATOR
                    );
                }

                unchecked { ++i; }
            }
            require(totalFee == DENOMINATOR, "Collection: Incorrect payment receivers shares");  // 100%

            emit PaymentDistributed(
                tokenId,
                paymentSettings.paymentAmount,
                paymentSettings.paymentReceivers,
                paymentSettings.receiversShares
            );
        }

        bytes32 creatorsHash = keccak256(abi.encode(
            royaltySettings.creators, royaltySettings.creatorsFees, royaltySettings.investorFee
        ));
        bytes32 paymentHash = keccak256(abi.encode(
            paymentSettings.paymentToken, paymentSettings.paymentAmount
        ));
        bytes32 receiversHash = keccak256(abi.encode(
            paymentSettings.paymentReceivers, paymentSettings.receiversShares
        ));

        if (isTokenBookedFrom(receiver, tokenId, bookingProof, creatorsHash, paymentHash, receiversHash)) {
            bookingList.performAction(
                keccak256(abi.encode(receiver, tokenId, creatorsHash, paymentHash, receiversHash)), 
                DEFAULT_LIMIT
            );
            
            _mint(receiver, tokenId);
            emit BookedTokenMinted(_msgSender(), receiver, tokenId);
            
            return true;
        }

        if (
            isTokenBookedFromAdmin(tokenId, bookingProof, creatorsHash, paymentHash, receiversHash) &&
            _isAdmin(_msgSender())
        ) {
            bookingList.performAction(
                keccak256(abi.encode(ADMINS_BOOKING_ADDRESS, tokenId, creatorsHash, paymentHash, receiversHash)), 
                DEFAULT_LIMIT
            );
            
            _mint(receiver, tokenId);
            emit AdminBookedTokenMinted(_msgSender(), receiver, tokenId);

            return true;
        }
        return false;
    }

    /**
     * @dev Internal function that facilitates minting of tokens 
     * by applying appropriate checks and updating counters
     * @param receiver The address that will receive the minted token
     * @param tokenId The unique identification number of the token to be minted
     * @param mintLimit The maximum number of tokens that can be minted during the current mint stage
     * @param bookingProof An array of booking proof hashes required for booked minting
     * @param whitelistProof An array of whitelist proof hashes required for whitelisted minting
     * @param royaltySettings An InputRoyaltySettings struct containing the royalty fee information for the token
     * @param paymentSettings An InputPaymentSettings struct containing payment information for the token
     * @param debt - Debt of a user (already payed value)
     */
    function _mintTo(
        address receiver, 
        uint256 tokenId, 
        uint256 mintLimit,
        bytes32[] calldata bookingProof, 
        bytes32[] calldata whitelistProof, 
        InputRoyaltySettings calldata royaltySettings,
        InputPaymentSettings calldata paymentSettings,
        uint256 debt
    ) private {

        if (_mintTo(
            receiver, 
            tokenId, 
            bookingProof, 
            royaltySettings,
            paymentSettings,
            debt
        )) {
            return;
        }

        if (mintStage == MintStage.PUBLIC) {
            require(publicMintsCounter[receiver] < publicMintTokensLimit, "Collection: Public mint limit reached");
            ++publicMintsCounter[receiver];

            _mint(receiver, tokenId);
            emit PublicTokenMinted(receiver, tokenId);
            
            return;
        } 

        bytes32 creatorsHash = keccak256(abi.encode(
            royaltySettings.creators, royaltySettings.creatorsFees, royaltySettings.investorFee
        ));
        bytes32 paymentHash = keccak256(abi.encode(
            paymentSettings.paymentToken, paymentSettings.paymentAmount
        ));
        bytes32 receiversHash = keccak256(abi.encode(
            paymentSettings.paymentReceivers, paymentSettings.receiversShares
        ));

        if (canMintWithWhitelist(
            receiver, 
            tokenId, 
            mintLimit, 
            bookingProof, 
            whitelistProof, 
            creatorsHash,
            paymentHash,
            receiversHash
        )) {
            bytes32 whitelistHash;
            assembly {
                whitelistHash := add(receiver, WHITELIST_ADDITION)
            }
            whitelist.performAction(whitelistHash, mintLimit);
            bookingList.performAction(
                keccak256(abi.encode(address(0), tokenId, creatorsHash, paymentHash, receiversHash)), 
                DEFAULT_LIMIT
            );
            
            _mint(receiver, tokenId);
            emit WhitelistedTokenMinted(receiver, tokenId);

            return;
        }

        revert("Collection: No rights to mint");
    }

    /**
     * @notice Batch mint multiple tokens with various settings.
     * @param tokensId An array of token IDs to be minted.
     * @param mintLimits An array of minting limits to be applied to the corresponding tokens.
     * @param bookingProofs An array of arrays containing the booking proofs for the corresponding tokens.
     * @param whitelistProofs An array of arrays containing the whitelist proofs for the corresponding tokens.
     * @param royaltySettings An array of InputRoyaltySettings structs containing the royalty settings for the corresponding tokens.
     * @param paymentSettings An array of InputPaymentSettings structs containing the payment settings for the corresponding tokens.
     *
     * This function allows batch minting of multiple tokens with various royalty and payment settings,
     * while providing individual booking and whitelist proofs for each token.
     * It requires the lengths of tokensId, mintLimits, bookingProofs, whitelistProofs, royaltySettings, 
     * and paymentSettings arrays to be equal, ensuring consistency across all data inputs.
     * It uses an auxiliary 'data' array to store intermediate data and to avoid stack overflow.
     * The function performs minting operations iteratively for each token in the input arrays,
     * updating the accumulated ETH payment amount stored in 'data[1]' accordingly.
     * After finishing the minting process, any excess ETH sent is returned to the _msgSender.
     **/
    function batchMint(
        uint256[] calldata tokensId, 
        uint256[] calldata mintLimits,
        bytes32[][] calldata bookingProofs, 
        bytes32[][] calldata whitelistProofs, 
        InputRoyaltySettings[] calldata royaltySettings,
        InputPaymentSettings[] calldata paymentSettings
    ) external payable nonReentrant {
        // `data` used to avoid stack overflow
        uint256[2] memory data;
        data[0] = tokensId.length;
        require(
            bookingProofs.length == data[0] && 
            whitelistProofs.length == data[0] && 
            mintLimits.length == data[0], 
            "Collection: Incorrect arrays length"
        );

        for (uint256 i; i < data[0]; ) {
            _mintTo(
                _msgSender(), // used to avoid stack overflow
                tokensId[i],
                mintLimits[i],
                bookingProofs[i], 
                whitelistProofs[i], 
                royaltySettings[i],
                paymentSettings[i],
                data[1]
            );
            
            if (paymentSettings[i].paymentToken == address(0)) {
                data[1] += paymentSettings[i].paymentAmount;
            }

            unchecked { ++i; }
        }

        if (msg.value > data[1]) {
            payable(_msgSender()).sendValue(msg.value - data[1]);
        }
    }
    
    /**
     * @notice Batch mint NFTs to a list of recipients.
     * @param receivers An array of recipient addresses to mint the NFTs to.
     * @param tokensId An array of token IDs to be minted.
     * @param bookingProofs An array of Merkle proofs associated with booking.
     * @param royaltySettings An array of InputRoyaltySettings, which include information about royalties for the minted NFTs.
     * @param paymentSettings An array of InputPaymentSettings, which include information about payment distribution for the minted NFTs.
     *
     * This function allows batch minting of tokens to a list of recipients with the specified royalty and payment settings.
     * It will require correct arrays length for receivers, tokensId, bookingProofs, royaltySettings, and paymentSettings.
     * It will mint NFTs to each recipient in the `receivers` array one by one, and update debt based on the payment settings provided.
     * If the remaining message value is greater than the debt after all NFTs are minted, excess ETH will be sent back to the caller.
     */
    function batchMintTo(
        address[] calldata receivers, 
        uint256[] calldata tokensId, 
        bytes32[][] calldata bookingProofs,
        InputRoyaltySettings[] calldata royaltySettings,
        InputPaymentSettings[] calldata paymentSettings
    ) external payable nonReentrant {
        uint256 l = tokensId.length;
        require(
            receivers.length == l && bookingProofs.length == l, 
            "Collection: Incorrect arrays length"
        );

        uint256 debt;
        for (uint256 i; i < l; ) {
            _mintTo(
                receivers[i], 
                tokensId[i], 
                bookingProofs[i],
                royaltySettings[i],
                paymentSettings[i],
                debt
            );

            if (paymentSettings[i].paymentToken == address(0)) {
                debt += paymentSettings[i].paymentAmount;
            }

            unchecked { ++i; }
        }

        if (msg.value > debt) {
            payable(_msgSender()).sendValue(msg.value - debt);
        }
    }

    /**
     * @notice Batch transfer NFTs in a secure way by validating compliance with the ERC721 standard.
     * @dev This function can be used to safely transfer multiple NFTs at once.
     * @param spenders Array of addresses that currently own the tokens.
     * @param receivers Array of addresses to receive the tokens.
     * @param tokensId Array of token IDs to be transferred.
     */
    function batchSafeTransferFrom(
        address[] calldata spenders, 
        address[] calldata receivers, 
        uint256[] calldata tokensId
    ) external {
        uint256 l = _getBatchTransferLength(spenders, receivers, tokensId);
        for (uint256 i; i < l; ) {
            safeTransferFrom(spenders[i], receivers[i], tokensId[i], "Collection: Incorrect arrays length");
            unchecked { ++i; }
        }
    }

    /**
     * @notice Batch transfer NFTs directly, without ERC721 standard validation.
     * @dev This function can be used to transfer multiple NFTs at once. It's not recommended to use this
     * function unless you are sure that the NFTs comply with the ERC721 standard.
     * @param spenders Array of addresses that currently own the tokens.
     * @param receivers Array of addresses to receive the tokens.
     * @param tokensId Array of token IDs to be transferred.
     */
    function batchTransferFrom(
        address[] calldata spenders, 
        address[] calldata receivers, 
        uint256[] calldata tokensId
    ) external {
        uint256 l = _getBatchTransferLength(spenders, receivers, tokensId);
        for (uint256 i; i < l; ) {
            transferFrom(spenders[i], receivers[i], tokensId[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Returns the number of elements in the `tokensId` array and checks if the length
     * @param spenders An array of spender addresses
     * @param receivers An array of receiver addresses
     * @param tokensId An array of token IDs to be transferred
     * @return l Length of the tokensId array
     * @dev Reverts if the lengths of spenders, receivers and tokensId arrays are not all equal.
     */
    function _getBatchTransferLength(
        address[] calldata spenders, 
        address[] calldata receivers, 
        uint256[] calldata tokensId
    ) private pure returns (uint256 l) {
        l = tokensId.length;
        require(spenders.length == l && receivers.length == l, "Collection: Incorrect arrays length");
    }

    /**
     * @notice Allows only the owner to update the royalty settings for a specified token.
     * @param tokenId Token ID for which the royalty settings need to be updated
     * @param creators An array of creator addresses
     * @param creatorsFees An array of royalties for the creators, corresponding to each creator's address
     * @dev Reverts if the tokenId does not exist, if the creator's address is zero, 
     * or if the sum of the creatorsFees do not equal the collection's earnings.
     */
    function updateRoyaltySettings(
        uint256 tokenId,
        address[] calldata creators,
        uint96[] calldata creatorsFees
    ) external onlyOwner {
        require(_exists(tokenId), "Collection: Token not exist");
        delete tokenRoyalty[tokenId].creators;

        uint96 totalFee;
        uint256 l = creators.length;
        for (uint256 i; i < l; ) {
            require(creators[i] != address(0), "Collection: Zero address");
            
            tokenRoyalty[tokenId].creators.push(FeeReceiver(
                creators[i], 
                creatorsFees[i]
            ));

            totalFee += creatorsFees[i];
            unchecked { ++i; }
        }

        require(
            totalFee + tokenRoyalty[tokenId].investor.fee == earnings, 
            "Collection: Earnings exceeded"
        );

        emit CreatorsRoyaltyChanged(
            tokenId,
            creators,
            creatorsFees
        );
    }

    /**
     * @dev Returns the Royalty settings for the specified tokenId
     *
     * @param tokenId The ID of the token to query the royalty settings for
     * @return investor FeeReceiver struct that includes the account and fee for the investor
     * @return creators Array of FeeReceiver structs that include the accounts and fees for the creators
     */
    function getRoyalySettings(
        uint256 tokenId
    ) external view returns (
        FeeReceiver memory investor,
        FeeReceiver[] memory creators
    ) {
        RoyaltyStorage memory token = tokenRoyalty[tokenId];
        investor = token.investor;
        creators = token.creators;
    }

    /**
     * @dev Verifies if a user can mint a token based on the specified tokenId, mintLimit,
     * proofs, hashes, and user role
     *
     * @param user The user's address who requests to mint the token
     * @param tokenId The ID of the token to mint
     * @param mintLimit The minting limit for a user
     * @param bookingProof The merkle proof for the booking operation
     * @param whitelistProof The merkle proof for the whitelist operation
     * @param creatorsHash The hash of the creators' information
     * @param paymentHash The hash of the payment information
     * @param receiversHash The hash of the payment receivers' information
     * @return True if the user can mint the token, otherwise False
     */
    function canMintToken(
        address user, 
        uint256 tokenId, 
        uint256 mintLimit,
        bytes32[] calldata bookingProof, 
        bytes32[] calldata whitelistProof, 
        bytes32 creatorsHash, 
        bytes32 paymentHash, 
        bytes32 receiversHash
    ) public view returns (bool) {
        if (isTokenBookedFrom(user, tokenId, bookingProof, creatorsHash, paymentHash, receiversHash)) {
            return true;
        }
        if (
            isTokenBookedFromAdmin(tokenId, bookingProof, creatorsHash, paymentHash, receiversHash) && 
            _isAdmin(user)
        ) {
            return true;
        }
        return canMintWithWhitelist(user, tokenId, mintLimit, bookingProof, whitelistProof, creatorsHash, paymentHash, receiversHash);
    }

    /**
     * @notice Checks if the user has whitelist access to mint given the mint limit and the provided proof.
     * @param user The address of the user.
     * @param mintLimit The limit of tokens the user can mint.
     * @param whitelistProof An array of 32-byte hash values, used for Merkle root proof.
     * @return True if the user has whitelist access, otherwise false.
     */
    function hasWhitelist(
        address user, 
        uint256 mintLimit,
        bytes32[] calldata whitelistProof
    ) public view returns (bool) {
        bytes32 whitelistHash;
        assembly {
            whitelistHash := add(user, WHITELIST_ADDITION)
        }
        whitelist.checkAction(whitelistHash, mintLimit);
        return MerkleTree.verify(
            whitelist,
            keccak256(abi.encode(user, mintLimit)),
            whitelistProof
        );
        /** @dev Member "vefiry" not found or not visible after argument-dependent lookup 
         *  in struct MerkleTree.MerkleData storage ref
         */
        // return whitelist.vefiry(
        //     keccak256(abi.encode(user, mintLimit)), 
        //     whitelistProof
        // );
    }

    /**
     * @dev Checks if the user can mint a token based on the conditions defined by the whitelist.
     * This function checks if the user has permission to mint via the whitelist and if the token is
     * not already booked.
     *
     * @param user The address of the user attempting to mint the token.
     * @param tokenId The ID of the token to be minted.
     * @param mintLimit The maximum number of tokens that can be minted by the user.
     * @param bookingProof The Merkle proof provided for the token's booking list.
     * @param whitelistProof The Merkle proof provided for the minting whitelist.
     * @param creatorsHash The hash of the token's creators and their respective royalty fees.
     * @param paymentHash The hash of the payment token and payment amount.
     * @param receiversHash The hash of the payment receivers and their respective shares.
     * @return bool Returns true if the user can mint the token based on the whitelist conditions, false otherwise.
     */

    function canMintWithWhitelist(
        address user, 
        uint256 tokenId, 
        uint256 mintLimit,
        bytes32[] calldata bookingProof, 
        bytes32[] calldata whitelistProof, 
        bytes32 creatorsHash, 
        bytes32 paymentHash, 
        bytes32 receiversHash
    ) public view returns (bool) {
        if (hasWhitelist(
            user, 
            mintLimit, 
            whitelistProof
        )) {
            return isTokenNotBooked(tokenId, bookingProof, creatorsHash, paymentHash, receiversHash);
        }
        return false;
    }

    /**
     * @notice Checks if the token is booked by the specified user using Merkle Tree proof validation.
     * @dev Confirms token existence, user booking and correct Merkle Tree proofs
     * @param user Address of the user booking the token
     * @param tokenId ID of the token being checked
     * @param bookingProof Merkle Tree proof for booking validation
     * @param creatorsHash Keccak256 hash of the creators and their fees details
     * @param paymentHash Keccak256 hash of the payment token and amount
     * @param receiversHash Keccak256 hash of the payment receivers and their shares
     * @return `true` if the token is booked by the user, else `false`
     */
    function isTokenBookedFrom(
        address user, 
        uint256 tokenId, 
        bytes32[] calldata bookingProof, 
        bytes32 creatorsHash, 
        bytes32 paymentHash, 
        bytes32 receiversHash
    ) public view returns (bool) {
        require(!_exists(tokenId), "Token already minted");

        return MerkleTree.verify(
            bookingList, 
            keccak256(abi.encode(user, tokenId, creatorsHash, paymentHash, receiversHash)),
            bookingProof
        );
        /** @dev Member "vefiry" not found or not visible after argument-dependent lookup 
         *  in struct MerkleTree.MerkleData storage ref
         */
        // return (bookingList.vefiry(
        //     keccak256(abi.encode(user, tokenId, creatorsHash, paymentHash, receiversHash)), 
        //     bookingProof
        // ));
    }

    /**
     * @dev Checks if the specified token has been booked by an admin using the admin's booking address.
     * @param tokenId The NFT token ID to check.
     * @param bookingProof The proof required to verify the booking.
     * @param creatorsHash The unique hash for creators and their respective royalty values.
     * @param paymentHash The unique hash for payment settings.
     * @param receiversHash The unique hash for payment receivers and their respective share values.
     * @return bool A boolean value indicating whether the specified token has been booked by an admin or not.
     */
    function isTokenBookedFromAdmin(
        uint256 tokenId, 
        bytes32[] calldata bookingProof, 
        bytes32 creatorsHash, 
        bytes32 paymentHash, 
        bytes32 receiversHash
    ) public view returns (bool) {
        return isTokenBookedFrom(ADMINS_BOOKING_ADDRESS, tokenId, bookingProof, creatorsHash, paymentHash, receiversHash);
    }

    /**
     * @notice Checks if a given tokenId is not booked.
     * @param tokenId The ID of the token to verify.
     * @param bookingProof An array containing the Merkle tree proof for booking verification.
     * @param creatorsHash The hash of the creators' data related to this token.
     * @param paymentHash The hash of the payment settings related to this token.
     * @param receiversHash The hash of the payment receivers' data related to this token.
     * @return bool True if the token is not booked, False otherwise.
     */
    function isTokenNotBooked(
        uint256 tokenId, 
        bytes32[] calldata bookingProof, 
        bytes32 creatorsHash, 
        bytes32 paymentHash, 
        bytes32 receiversHash
    ) public view returns (bool) {
        return isTokenBookedFrom(address(0), tokenId, bookingProof, creatorsHash, paymentHash, receiversHash);
    }

    /**
     * @notice Withdraws the specified token or ETH from the contract to the owner.
     * @dev If the tokenAddress is the zero address, withdraws the ETH funds (minus royalties) from the contract.
     *      If the tokenAddress is a valid ERC20 token address, withdraws the token balance to the owner.
     * @param tokenAddress The address of the token to withdraw (or zero address for ETH).
     */
    function withdraw(address tokenAddress) external nonReentrant onlyOwner {
        uint256 toWithdraw;
        if (tokenAddress == address(0)) {
            toWithdraw = address(this).balance - royaltyReceiver.receivedAmount;
            require(toWithdraw > 0, "Collection: Nothing to withdraw");
            payable(_msgSender()).sendValue(toWithdraw);
        } else {
            toWithdraw = IERC20(tokenAddress).balanceOf(address(this));
            IERC20(tokenAddress).transfer(_msgSender(), toWithdraw);
        }

        emit Withdrawn(_msgSender(), tokenAddress, toWithdraw);
    }

    /**
     * @notice Returns the name of the NFT collection.
     * @dev Overrides the name() function of the ERC721 standard.
     * @return The name of this NFT collection.
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    /**
     * @notice Returns the symbol of the NFT collection.
     * @dev Overrides the symbol() function of the ERC721 standard.
     * @return The symbol of this NFT collection.
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    /**
     * @notice Returns the base URI of the NFT collection.
     * @dev Overrides the _baseURI() function of the ERC721 standard.
     * @return The base URI of this NFT collection.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI_;
    }
    
    /**
     * @dev Internal function that burns a specific token and removes its associated royalty information.
     * @param tokenId The ID of the token to be burnt.
     */
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
        delete tokenRoyalty[tokenId];
    }

    /**
     * @dev Private function that calculates a unique hash used for royalty payments.
     * @return bytes32 Unique sender hash derived from transaction details.
     */
    function _calcSenderHash() private view returns (bytes32) {
        return keccak256(abi.encode(tx.origin, block.number, block.timestamp));
    }

    /**
     * @dev Private function that checks whether the generated sender hash matches
     * the stored royalty receiver hash. It resets the royalty receiver information
     * and updates the stored sender hash.
     */
    function _checkSenderHash() private {
        bytes32 currentHash = _calcSenderHash();
        if (royaltyReceiver.senderHash == currentHash) return;

        delete royaltyReceiver;
        royaltyReceiver.senderHash = currentHash;
    }

    /**
     * @dev Private function that sends royalties to the appropriate recipients.
     * It calculates the amount of royalty to send to each creator based on their fee.
     * It sends the royalty payments and emits a RoyaltySended event for each payment.
     * Any residual amount is transferred to the investor account.
     */
    function _sendRoyalty() private nonReentrant {
        uint256 _tokenId = royaltyReceiver.tokenId;
        uint256 _royaltyAmount = royaltyReceiver.receivedAmount;

        delete royaltyReceiver;
        uint256 residue = _royaltyAmount;

        RoyaltyStorage memory token = tokenRoyalty[_tokenId];

        uint256 l = token.creators.length;
        for (uint256 i; i < l; ) {
            uint256 toSend = _royaltyAmount * token.creators[i].fee / earnings;
            residue -= toSend;

            payable(token.creators[i].account).sendValue(toSend);
            emit RoyaltySended(_tokenId, token.creators[i].account, toSend);

            unchecked { ++i; }
        }

        if (residue > 0) {
            payable(token.investor.account).sendValue(residue);
            emit RoyaltySended(_tokenId, token.investor.account, residue);
        }
    }

    /**
     * @dev Ensures transfers are within collection supply limit, handles royalty payments,
     * checks and updates the sender hash, and calls the base ERC721Enumerable._beforeTokenTransfer.
     * @param from The address of the sender (previous owner of the tokens).
     * @param to The address of the recipient (new owner of the tokens).
     * @param firstTokenId The ID of the first token being transferred.
     * @param batchSize The number of tokens being transferred.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721Enumerable) {
        require(firstTokenId < supplyLimit, "Collection: Supply limit exceeded");

        if (from == address(0) || to == address(0)) {
            delete royaltyReceiver;
        } else {
            _checkSenderHash();

            royaltyReceiver.tokenId = firstTokenId;

            if (royaltyReceiver.receivedAmount > 0) {
                _sendRoyalty();
            } else {
                royaltyReceiver.isTokenTransfered = true;
            }
        }

        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @notice Transfers the ownership of the collection to a new owner.
     * @dev Overrides the default transferOwnership function to add custom requirements.
     * The collection must be platform enabled, and the new owner must have the BRAND_ADMIN_ROLE.
     * Only callable by the current owner of the collection.
     * @param newOwner The address of the new owner for the collection.
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        require(
            masterStation.isCollectionEnabled(address(this)), 
            "Collection: Not possible when collection is platform decoupled"
        );
        require(
            masterStation.hasAccessToBrand(
                ownedByBrand,
                BRAND_ADMIN_ROLE,
                newOwner
            ),
            "Collection: The new owner must be a brand admin"
        );
        super.transferOwnership(newOwner);
    }

    /**
     * @dev Checks if the `spender` is the owner or an approved operator of the token with ID `tokenId`.
     * Additionally, it checks if the `spender` is an admin when the owner is the contract itself.
     *
     * @param spender The address of the spender.
     * @param tokenId The ID of the token.
     * @return bool True if the `spender` is the owner or an approved operator or an admin,
     * otherwise false.
     **/
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view override returns (bool) {
        address owner = ERC721.ownerOf(tokenId);
        return (
            spender == owner || 
            isApprovedForAll(owner, spender) || 
            getApproved(tokenId) == spender ||
            (owner == address(this) && _isAdmin(spender))
        );
    }

    /**
     * @dev Returns tokenURI for the given token ID.
     *
     * Concatenates the `baseURI` with the `tokenId` and ".json" to form the tokenURI.
     * If `baseURI` is empty, an empty string is returned.
     * 
     * @param tokenId The unique identifier for a token.
     * @return A string representing the tokenURI.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
    }

    /**
     * @dev Checks if an account is an admin or the owner of the collection.
     *
     * Checks if the given account has access to the COLLECTION_ADMIN_ROLE or is the owner of the collection.
     * 
     * @param account The address of the account to check.
     * @return A boolean value indicating whether the given account is an admin or the owner of the collection.
     */
    function _isAdmin(address account) private view returns (bool) {
        return (masterStation.hasAccessToCollection(
            ownedByBrand, 
            address(this),
            COLLECTION_ADMIN_ROLE, 
            account
        ) || isOwner(_msgSender()));
    }
}