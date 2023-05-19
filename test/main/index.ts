import { ethers } from "hardhat";
import { expect } from "chai";

import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { MerkleTree } from "merkletreejs";
import { 
    calcTree,
    getRoot, 
    getProofByBookingData,
    getProofByHash,
    getProofByWhitelistData, 
    keccakB, 
    keccakWL,
    calcRoots,
    getTrees,
    getBytes32BookingArray,
    getBytes32WhitelistArray
} from "../../scripts/merkle";

import { 
    Collection, 
    CBCOIN, 
    Factory, 
    MasterStation, 
    Payments, 
    Treasury,
    MockMarketplace
} from "../../typechain-types";

import { 
    Collection__factory,
    CBCOIN__factory,
    Factory__factory,
    MasterStation__factory,
    Payments__factory,
    Treasury__factory,
    MockMarketplace__factory
} from "../../typechain-types";

interface CreateCollectionData {
    brandName: string,
    creator: string,
    supplyLimit: BigNumber,
    paymentAmount: BigNumber,
    deadline: BigNumber,
    salt: BigNumber
}

interface BuyTokensData {
    receiver: string,
    paymentToken: string,
    paymentAmount: BigNumber,
    amountOfCBCOINToPurchase: BigNumber,
    deadline: BigNumber,
    salt: BigNumber
}

interface Signature {
    v: number,
    r: string,
    s: string
}

interface InputRoyaltySettings {
    investorFee: BigNumber,
    creators: string[],
    creatorsFees: BigNumber[]
}

interface InputPaymentSettings {
    paymentToken: string,
    paymentAmount: BigNumber,
    paymentReceivers: string[],
    receiversShares: BigNumber[]
}

interface CollectionData {
    name: string,
    symbol: string,
    baseURI: string,
    whitelist: string,
    bookingList: string,
    publicMintTokensLimit: BigNumber,
    earnings: BigNumber,
    mintStage: number
}

interface Whitelist {
    account: string,
    mintLimit: BigNumber
}

interface BookingList {
    account: string,
    tokneId: BigNumber,
    royaltySettings: InputRoyaltySettings,
    paymentSettings: InputPaymentSettings
}

const zeroAddress = ethers.constants.AddressZero;
const zeroHash = ethers.constants.HashZero;
const uintMax = ethers.constants.MaxUint256;
const adminsAddress = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF";

const DEFAULT_ADMIN_ROLE = 255;
const CHIEF_ADMIN_ROLE = 224;
const PLATFORM_ADMIN_ROLE = 192;
const BRAND_ADMIN_ROLE = 128;
const COLLECTION_ADMIN_ROLE = 96;
const LIST_MODERATOR_ROLE = 64;

const parse = ethers.utils.parseEther;
const format = ethers.utils.formatEther;

const supplyLimiy = parse("1000000");

let signer: SignerWithAddress;
let chief: SignerWithAddress;
let validator: SignerWithAddress;
let accs: SignerWithAddress[];

let implementation: string;
let collection: Collection;
let cbcoin: CBCOIN;
let master: MasterStation;
let payments: Payments;
let treasury: Treasury;
let factory: Factory;
let marketplace: MockMarketplace;

let salt = BigNumber.from("0");

function getSalt(): BigNumber {
    const _salt = salt;
    salt = salt.add("1");
    return _salt;
}

describe("Master and Collection", function () {

    beforeEach(async () => {
        accs = await ethers.getSigners();
        signer = accs[0];
        chief = accs[1];
        validator = accs[19];

        master = await new MasterStation__factory(signer).deploy(signer.address, chief.address);
        await master.deployed();
        await master.deployTransaction.wait();
        
        cbcoin = await new CBCOIN__factory(signer).deploy(master.address, supplyLimiy);
        await cbcoin.deployed();
        await cbcoin.deployTransaction.wait();

        const collectionImplementation = await new Collection__factory(signer).deploy();
        await collectionImplementation.deployed();
        await collectionImplementation.deployTransaction.wait();
        implementation = collectionImplementation.address;
        
        factory = await new Factory__factory(signer).deploy(master.address, implementation);
        await factory.deployed();
        await factory.deployTransaction.wait();

        treasury = await new Treasury__factory(signer).deploy(cbcoin.address, master.address);
        await treasury.deployed();
        await treasury.deployTransaction.wait();

        payments = await new Payments__factory(signer).deploy(treasury.address, master.address);
        await payments.deployed();
        await payments.deployTransaction.wait();

        await treasury.setPaymentsContractAddress(payments.address);
        await master.setCBCOIN(cbcoin.address);
        await master.setFactory(factory.address);
        await master.setPaymentsContract(payments.address);

        await master.grantValidatorRole(validator.address);

        await cbcoin.mint(signer.address, parse("500000"));
        await cbcoin.approve(master.address, parse("1000"));

        const _createCollectionData: CreateCollectionData = {
            brandName: "brandName",
            creator: signer.address,
            supplyLimit: BigNumber.from("1000"),
            paymentAmount: BigNumber.from("1000"),
            deadline: BigNumber.from("100000000000"),
            salt: getSalt()
        }

        const hash = await payments.getCreateCollectionHash(_createCollectionData);
        const fullySignature = await validator.signMessage(ethers.utils.arrayify(hash));
        const splittedSignature = ethers.utils.splitSignature(fullySignature);
        const signature: Signature = {
            v: splittedSignature.v,
            r: splittedSignature.r,
            s: splittedSignature.s
        }

        expect((await master.listCreatedBrandCollections("brandName")).length).to.be.eq(0);
        await master.createCollection(_createCollectionData, [signature]);
        expect((await master.listCreatedBrandCollections("brandName")).length).to.be.eq(1);

        const collectionData: CollectionData = {
            name: "name",
            symbol: "symbol",
            baseURI: "uri",
            whitelist: zeroHash,
            bookingList: zeroHash,
            publicMintTokensLimit: BigNumber.from("1"),
            earnings: BigNumber.from("1000"),
            mintStage: 0
        }

        await master.deployCollection("brandName", 0, collectionData);
        collection = await ethers.getContractAt("Collection", (await master.listDeployedBrandCollections("brandName"))[0], signer);
        expect(await collection.supplyLimit()).to.be.eq(1000);

        await expect(collection.initialize(
            master.address,
            "brandName",
            signer.address,
            1000,
            collectionData
        )).to.be.revertedWith("Collection: Initialization only");

        marketplace = await new MockMarketplace__factory(signer).deploy(collection.address);
    });

    describe("Mint testing", function () {

        let trees: MerkleTree[];
        let tokensData: BookingList[] = [];
        let whitelistData: Whitelist[] = [];

        beforeEach(async () => {});

        it("mintTo", async () => {
            tokensData[0] = {
                account: signer.address,
                tokneId: BigNumber.from("0"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: BigNumber.from("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }
            trees = getTrees([], tokensData);

            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                1
            );
            
            await expect(collection.mintTo(
                signer.address,
                1,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");

            await expect(collection.mintTo(
                signer.address,
                0,
                [zeroHash],
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");

            await expect(collection.mintTo(
                validator.address,
                0,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");

            await expect(collection.mintTo(
                signer.address,
                0,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).not.be.reverted;

            await expect(collection.mintTo(
                signer.address,
                0,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: Token already minted");
        });

        it("mintTo admin", async () => {
            tokensData[0] = {
                account: adminsAddress,
                tokneId: BigNumber.from("1"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: BigNumber.from("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }
            trees = getTrees([], tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                1
            );
            
            await expect(collection.connect(accs[2]).mintTo(
                accs[2].address,
                1,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");
            
            await master.grantCollectionAdminRole("brandName", collection.address, accs[2].address);
            
            await expect(collection.connect(accs[3]).mintTo(
                accs[3].address,
                1,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");

            await expect(collection.connect(accs[2]).mintTo(
                accs[2].address,
                1,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).not.be.reverted;
        });

        it("mintTo royalty and ETH payment", async () => {
            tokensData[0] = {
                account: signer.address,
                tokneId: BigNumber.from("2"),
                royaltySettings: {
                    investorFee: BigNumber.from("500"),
                    creators: [accs[2].address, accs[3].address],
                    creatorsFees: [BigNumber.from("300"), BigNumber.from("200")]
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("1"),
                    paymentReceivers: [accs[4].address, accs[5].address],
                    receiversShares: [BigNumber.from("7000"), BigNumber.from("3000")]
                }
            }
            trees = getTrees([], tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                1
            );
            
            const balsBefore = [
                await ethers.provider.getBalance(accs[4].address),
                await ethers.provider.getBalance(accs[5].address)
            ]

            const royaltyBefore = await collection.getRoyalySettings(2);
            expect(royaltyBefore.investor.account).to.be.eq(zeroAddress);
            expect(royaltyBefore.creators.length).to.be.eq(0);
            
            await expect(collection.mintTo(
                signer.address,
                2,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings,
                {value: parse("0.1")}
            )).to.be.revertedWith("Collection: Not enough ETH");

            await expect(collection.mintTo(
                signer.address,
                2,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("1"),
                    paymentReceivers: [accs[4].address, accs[5].address],
                    receiversShares: [BigNumber.from("10000"), BigNumber.from("3000")]
                },
                {value: parse("0.1")}
            )).to.be.revertedWith("Collection: Not enough ETH");
            
            await expect(collection.mintTo(
                signer.address,
                2,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("1"),
                    paymentReceivers: [accs[4].address, accs[5].address],
                    receiversShares: [BigNumber.from("3000")]
                },
                {value: parse("1")}
            )).to.be.revertedWith("Collection: Incorrect arrays length");

            await expect(collection.mintTo(
                signer.address,
                2,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("1"),
                    paymentReceivers: [accs[5].address],
                    receiversShares: [BigNumber.from("7000"), BigNumber.from("3000")]
                },
                {value: parse("1")}
            )).to.be.revertedWith("Collection: Incorrect arrays length");

            await expect(collection.mintTo(
                signer.address,
                2,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings,
                {value: parse("1")}
            )).not.be.reverted;

            const balsAfter = [
                await ethers.provider.getBalance(accs[4].address),
                await ethers.provider.getBalance(accs[5].address)
            ]

            expect(balsAfter[0].sub(balsBefore[0])).to.be.eq(parse("1").mul(7000).div(10000));
            expect(balsAfter[1].sub(balsBefore[1])).to.be.eq(parse("1").mul(3000).div(10000));
            expect(balsAfter[1].sub(balsBefore[1]).add(balsAfter[0]).sub(balsBefore[0])).to.be.eq(parse("1"));

            const royaltyAfter = await collection.getRoyalySettings(2);
            expect(royaltyAfter.investor.account).to.be.eq(signer.address);
            expect(royaltyAfter.investor.fee).to.be.eq(500);
            expect(royaltyAfter.creators.length).to.be.eq(2);
            expect(royaltyAfter.creators[0].account).to.be.eq(accs[2].address);
            expect(royaltyAfter.creators[1].account).to.be.eq(accs[3].address);
            expect(royaltyAfter.creators[0].fee).to.be.eq(300);
            expect(royaltyAfter.creators[1].fee).to.be.eq(200);

            await collection.setApprovalForAll(marketplace.address, true);
            await marketplace.sell(2, parse("1"));

            const balsBefore1 = [
                await ethers.provider.getBalance(signer.address),
                await ethers.provider.getBalance(accs[2].address),
                await ethers.provider.getBalance(accs[3].address)
            ]

            await marketplace.connect(accs[4]).buy1(2, {value: parse("1")});

            const balsAfter1 = [
                await ethers.provider.getBalance(signer.address),
                await ethers.provider.getBalance(accs[2].address),
                await ethers.provider.getBalance(accs[3].address)
            ]

            expect(balsAfter1[0].sub(balsBefore1[0])).to.be.eq(parse("1").sub(parse("1").mul(500).div(10000)));
            expect(balsAfter1[1].sub(balsBefore1[1])).to.be.eq(parse("1").mul(300).div(10000));
            expect(balsAfter1[2].sub(balsBefore1[2])).to.be.eq(parse("1").mul(200).div(10000));

            await collection.connect(accs[4]).setApprovalForAll(marketplace.address, true);
            await marketplace.connect(accs[4]).sell(2, parse("1"));

            const balsBefore2 = [
                await ethers.provider.getBalance(accs[4].address),
                await ethers.provider.getBalance(accs[2].address),
                await ethers.provider.getBalance(accs[3].address),
                await ethers.provider.getBalance(accs[5].address),
                await ethers.provider.getBalance(signer.address)
            ]

            await marketplace.connect(accs[5]).buy1(2, {value: parse("1")});

            const balsAfter2 = [
                await ethers.provider.getBalance(accs[4].address),
                await ethers.provider.getBalance(accs[2].address),
                await ethers.provider.getBalance(accs[3].address),
                await ethers.provider.getBalance(accs[5].address),
                await ethers.provider.getBalance(signer.address)
            ]

            expect(balsAfter2[0].sub(balsBefore2[0])).to.be.eq(parse("1").mul(9000).div(10000));
            expect(balsAfter2[1].sub(balsBefore2[1])).to.be.eq(parse("1").mul(300).div(10000));
            expect(balsAfter2[2].sub(balsBefore2[2])).to.be.eq(parse("1").mul(200).div(10000));
            expect(balsAfter2[4].sub(balsBefore2[4])).to.be.eq(parse("1").mul(500).div(10000));
        });

        it("mintTo token payment", async () => {
            tokensData[0] = {
                account: signer.address,
                tokneId: BigNumber.from("3"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: cbcoin.address,
                    paymentAmount: parse("1000"),
                    paymentReceivers: [accs[4].address, accs[5].address],
                    receiversShares: [BigNumber.from("7000"), BigNumber.from("3000")]
                }
            }
            trees = getTrees([], tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                1
            );
            
            const balsBefore = [
                await cbcoin.balanceOf(accs[4].address),
                await cbcoin.balanceOf(accs[5].address)
            ]
            
            await expect(collection.mintTo(
                signer.address,
                3,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("ERC20: insufficient allowance");
            
            await cbcoin.approve(collection.address, parse("1000"));
            
            await expect(collection.mintTo(
                signer.address,
                3,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings,
                {value: 1}
            )).to.be.revertedWith("Collection: ETH is not required");

            await expect(collection.mintTo(
                signer.address,
                3,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).not.be.reverted;

            const balsAfter = [
                await cbcoin.balanceOf(accs[4].address),
                await cbcoin.balanceOf(accs[5].address)
            ]

            expect(balsAfter[0].sub(balsBefore[0])).to.be.eq(parse("1000").mul(7000).div(10000));
            expect(balsAfter[1].sub(balsBefore[1])).to.be.eq(parse("1000").mul(3000).div(10000));
            expect(balsAfter[1].sub(balsBefore[1]).add(balsAfter[0]).sub(balsBefore[0])).to.be.eq(parse("1000"));
        });

        it("mint", async () => {
            tokensData[0] = {
                account: zeroAddress,
                tokneId: BigNumber.from("4"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }
            tokensData[1] = {
                account: zeroAddress,
                tokneId: BigNumber.from("5"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }
            trees = getTrees([], tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                2
            );
            
            await expect(collection.mintTo(
                signer.address,
                4,
                getProofByBookingData(trees[1], tokensData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");
            
            whitelistData[0] = {
                account: signer.address,
                mintLimit: BigNumber.from(1)
            }
            
            await expect(collection.mint(
                4,
                1,
                getProofByBookingData(trees[1], tokensData[0]),
                getProofByWhitelistData(trees[0], whitelistData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");
            
            trees = getTrees(whitelistData, tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                2
            );
            
            await expect(collection.mint(
                4,
                2,
                getProofByBookingData(trees[1], tokensData[0]),
                getProofByWhitelistData(trees[0], whitelistData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: No rights to mint");

            await expect(collection.mint(
                4,
                1,
                getProofByBookingData(trees[1], tokensData[0]),
                getProofByWhitelistData(trees[0], whitelistData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).not.be.reverted;

            await expect(collection.mint(
                5,
                1,
                getProofByBookingData(trees[1], tokensData[1]),
                getProofByWhitelistData(trees[0], whitelistData[0]),
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("MerkleTree: Action already performed");

            whitelistData[0] = {
                account: signer.address,
                mintLimit: BigNumber.from(2)
            }

            trees = getTrees(whitelistData, tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                2
            );
            
            await expect(collection.mint(
                5,
                2,
                getProofByBookingData(trees[1], tokensData[1]),
                getProofByWhitelistData(trees[0], whitelistData[0]),
                tokensData[1].royaltySettings,
                tokensData[1].paymentSettings
            )).not.be.reverted;
        });

        it("public mint", async () => {
            tokensData[0] = {
                account: zeroAddress,
                tokneId: BigNumber.from("6"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }

            tokensData[1] = {
                account: zeroAddress,
                tokneId: BigNumber.from("7"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: parse("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }

            trees = getTrees([], tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                1
            );

            await expect(collection.mint(
                6,
                0,
                getProofByBookingData(trees[1], tokensData[0]),
                [],
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).not.be.reverted;

            await expect(collection.mint(
                7,
                0,
                getProofByBookingData(trees[1], tokensData[1]),
                [],
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).to.be.revertedWith("Collection: Public mint limit reached");

            await collection.updatePublicMintTokensLimit(2);

            await expect(collection.mint(
                7,
                0,
                getProofByBookingData(trees[1], tokensData[1]),
                [],
                tokensData[0].royaltySettings,
                tokensData[0].paymentSettings
            )).not.be.reverted;
        });

        it("batch mintTo ETH payment", async () => {
            tokensData[0] = {
                account: signer.address,
                tokneId: BigNumber.from("10"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: BigNumber.from("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }
            tokensData[1] = {
                account: signer.address,
                tokneId: BigNumber.from("11"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: BigNumber.from("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }
            tokensData[2] = {
                account: signer.address,
                tokneId: BigNumber.from("12"),
                royaltySettings: {
                    investorFee: BigNumber.from("1000"),
                    creators: [],
                    creatorsFees: []
                },
                paymentSettings: {
                    paymentToken: zeroAddress,
                    paymentAmount: BigNumber.from("0"),
                    paymentReceivers: [],
                    receiversShares: []
                }
            }
            trees = getTrees([], tokensData);
            
            await collection.updateTreesAndMintStage(
                getRoot(trees[0]),
                getRoot(trees[1]),
                1
            );
            const tokenBalBefore = await collection.balanceOf(signer.address);
           
            await expect(collection.batchMintTo(
                [signer.address, signer.address, signer.address],
                [10, 11, 12],
                [
                    getProofByBookingData(trees[1], tokensData[0]),
                    getProofByBookingData(trees[1], tokensData[1]),
                    getProofByBookingData(trees[1], tokensData[2])
                ],
                [
                    tokensData[0].royaltySettings,
                    tokensData[1].royaltySettings,
                    tokensData[2].royaltySettings,
                ],
                [
                    tokensData[0].paymentSettings,
                    tokensData[1].paymentSettings,
                    tokensData[2].paymentSettings
                ]
            )).not.be.reverted;
            const tokenBalAfter = await collection.balanceOf(signer.address);
            expect(tokenBalAfter.sub(tokenBalBefore)).to.be.eq(3);
        });
    });
});