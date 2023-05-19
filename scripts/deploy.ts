import { ethers, run } from "hardhat";

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
} from "../scripts/merkle";

import { 
    Collection, 
    CBCOIN, 
    Factory, 
    MasterStation, 
    Payments, 
    Treasury,
    MockMarketplace
} from "../typechain-types";

import { 
    Collection__factory,
    CBCOIN__factory,
    Factory__factory,
    MasterStation__factory,
    Payments__factory,
    Treasury__factory,
    MockMarketplace__factory
} from "../typechain-types";

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

const supplyLimiy = parse("10000000");

let signer: SignerWithAddress;
let chief: string;
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

async function main() {
    accs = await ethers.getSigners();
    signer = accs[0];
    chief = "0x041D9F0b85856a2Da8Ffa40a4ba2Cfaa9e59f16b";
    validator = signer;

    master = await new MasterStation__factory(signer).deploy(signer.address, chief);
    await master.deployed();
    await master.deployTransaction.wait();
    console.log("MASTER", master.address);
    
    cbcoin = await new CBCOIN__factory(signer).deploy(master.address, supplyLimiy);
    await cbcoin.deployed();
    await cbcoin.deployTransaction.wait();
    console.log("CBCOIN", cbcoin.address);

    const collectionImplementation = await new Collection__factory(signer).deploy();
    await collectionImplementation.deployed();
    await collectionImplementation.deployTransaction.wait();
    console.log("IMPLEMENTATION", collectionImplementation.address);
    implementation = collectionImplementation.address;
    
    factory = await new Factory__factory(signer).deploy(master.address, implementation);
    await factory.deployed();
    await factory.deployTransaction.wait();
    console.log("FACTORY", factory.address);

    treasury = await new Treasury__factory(signer).deploy(cbcoin.address, master.address);
    await treasury.deployed();
    await treasury.deployTransaction.wait();
    console.log("TREASURY", treasury.address);

    payments = await new Payments__factory(signer).deploy(treasury.address, master.address);
    await payments.deployed();
    await payments.deployTransaction.wait();
    console.log("PAYMENTS", payments.address);

    let tx = await treasury.setPaymentsContractAddress(payments.address);
    await tx.wait();

    tx = await master.setCBCOIN(cbcoin.address);
    await tx.wait();

    tx = await master.setFactory(factory.address);
    await tx.wait();

    tx = await master.setPaymentsContract(payments.address);
    await tx.wait();

    tx = await master.grantValidatorRole(validator.address);
    await tx.wait();

    tx = await cbcoin.mint(signer.address, parse("500000"));
    await tx.wait();

    tx = await cbcoin.approve(master.address, parse("1000"));
    await tx.wait();

    const _createCollectionData: CreateCollectionData = {
        brandName: "brandName",
        creator: signer.address,
        supplyLimit: BigNumber.from("1000"),
        paymentAmount: BigNumber.from("1000"),
        deadline: BigNumber.from("100000000000"),
        salt: BigNumber.from("0")
    }

    const hash = await payments.getCreateCollectionHash(_createCollectionData);
    const fullySignature = await validator.signMessage(ethers.utils.arrayify(hash));
    const splittedSignature = ethers.utils.splitSignature(fullySignature);
    const signature: Signature = {
        v: splittedSignature.v,
        r: splittedSignature.r,
        s: splittedSignature.s
    }

    tx = await master.createCollection(_createCollectionData, [signature]);
    await tx.wait();

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

    tx = await master.deployCollection("brandName", 0, collectionData);
    await tx.wait();
    collection = await ethers.getContractAt("Collection", (await master.listDeployedBrandCollections("brandName"))[0], signer);
    console.log("COLLECTION", collection.address);

    marketplace = await new MockMarketplace__factory(signer).deploy(collection.address);
    await marketplace.deployed();
    await marketplace.deployTransaction.wait();
    console.log("MARKETPLACE", marketplace.address);

    tx = await cbcoin.mint(treasury.address, parse("500000"));
    await tx.wait();

    await run("verify:verify", {
        address: master.address,
        constructorArguments: [signer.address, chief],
    });
    
      await run("verify:verify", {
        address: cbcoin.address,
        constructorArguments: [master.address, supplyLimiy],
      });
    
      await run("verify:verify", {
        address: collectionImplementation.address,
        constructorArguments: [],
      });
    
      await run("verify:verify", {
        address: factory.address,
        constructorArguments: [master.address, implementation],
      });
    
      await run("verify:verify", {
        address: treasury.address,
        constructorArguments: [cbcoin.address, master.address],
      });

      await run("verify:verify", {
        address: payments.address,
        constructorArguments: [treasury.address, master.address],
      });

      await run("verify:verify", {
        address: collection.address,
        constructorArguments: [collectionImplementation.address],
      });

      await run("verify:verify", {
        address: marketplace.address,
        constructorArguments: [collection.address],
      });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});