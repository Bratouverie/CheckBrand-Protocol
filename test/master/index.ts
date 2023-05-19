import { ethers } from "hardhat";
import { expect } from "chai";

import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { 
    Collection, 
    Factory,
    MasterStation,
    CBCOIN,
    Payments,
    Treasury
} from "../../typechain-types";

import { 
    Collection__factory,
    Factory__factory,
    MasterStation__factory,
    CBCOIN__factory,
    Payments__factory,
    Treasury__factory
} from "../../typechain-types";

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

interface CreateCollectionData {
    brandName: string,
    creator: string,
    supplyLimit: BigNumber,
    paymentAmount: BigNumber,
    deadline: BigNumber,
    salt: BigNumber
}

interface Signature {
    v: number,
    r: string,
    s: string
}

const DEFAULT_ADMIN_ROLE = 255;
const CHIEF_ADMIN_ROLE = 224;
const PLATFORM_ADMIN_ROLE = 192;
const BRAND_ADMIN_ROLE = 128;
const COLLECTION_ADMIN_ROLE = 96;
const LIST_MODERATOR_ROLE = 64;

const zeroAddress = ethers.constants.AddressZero;
const zeroHash = ethers.constants.HashZero;
const uintMax = ethers.constants.MaxUint256;
const adminsAddress = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF";

const parse = ethers.utils.parseEther;
const format = ethers.utils.formatEther;

const supplyLimiy = parse("1000000");

let signer: SignerWithAddress;
let chief: SignerWithAddress;
let validator: SignerWithAddress;
let accs: SignerWithAddress[];

let implementation: string;
let factory: Factory;
let cbcoin: CBCOIN;
let payments: Payments;
let treasury: Treasury;
let master: MasterStation;
let collection: Collection;
let data: CollectionData;

let salt = BigNumber.from("0");

function getSalt(): BigNumber {
    const _salt = salt;
    salt = salt.add("1");
    return _salt;
}

describe("MasterStation", function () {

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
        await cbcoin.mint(treasury.address, parse("10000"));
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
    });

    it("Should revert if self-revoke", async () => {
        await master.grantBrandAdminRole("brandName", accs[2].address);
        await expect(master.connect(accs[2]).revokeBrandAdminRole("testBrand", accs[2].address))
            .to.be.revertedWith("MasterStation: Cant self-revoke");
    });

    it("Should revert if try to revoke fron non-existent brand", async () => {
        await master.grantBrandAdminRole("brandName", accs[2].address);
        await expect(master.revokeBrandAdminRole("testBrand", accs[2].address))
            .to.be.revertedWith("MasterStation: Non-existent brand");
    });

    it("Should revoke another address", async () => {
        await master.grantBrandAdminRole("brandName", accs[2].address);
        await expect(master.revokeBrandAdminRole("brandName", accs[2].address))
            .not.be.reverted;
    });
    
    it("Should create collection if brand already exist", async () => {
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

        expect((await master.listBrands()).length).to.be.eq(1);
        expect((await master.listCreatedBrandCollections("brandName")).length).to.be.eq(0);
        await master.createCollection(_createCollectionData, [signature]);
        expect((await master.listBrands()).length).to.be.eq(1);
        expect((await master.listCreatedBrandCollections("brandName")).length).to.be.eq(1);
    });

    it("Should revert creation of a collection if sender != creator", async () => {
        const _createCollectionData: CreateCollectionData = {
            brandName: "brandName2",
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

        await expect(master.connect(accs[2]).createCollection(_createCollectionData, [signature]))
            .to.be.revertedWith("MasterStation: Incorrect sender");
    });

    it("Should revert deploying collection if collection not exist", async () => {
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

        await expect(master.deployCollection("brand_", 0, collectionData))
            .to.be.revertedWith("MasterStation: Non-existent collection");
    });

    it("Should revert deploying collection if sender != creator", async () => {
        const _createCollectionData: CreateCollectionData = {
            brandName: "brandName2",
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

        await expect(master.createCollection(_createCollectionData, [signature]))
            .not.be.reverted;

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

        await expect(master.connect(accs[2]).deployCollection("brandName2", 0, collectionData))
            .to.be.revertedWith("MasterStation: Incorrect deployer");
    });

    it("Should revert collection disable if collection not exist in brand", async () => {
        await expect(master.disableCollection("brandName", zeroAddress))
            .to.be.revertedWith("MasterStation: Brand does not have this collection");
    });

    it("Should revert collection disable if sender != owner", async () => {
        await expect(master.connect(accs[2]).disableCollection("brandName", collection.address))
            .to.be.revertedWith("MasterStation: Collection owner only");
    });

    it("Should disable collection", async () => {
        await expect(master.disableCollection("brandName", collection.address))
            .not.be.reverted;
    });

    it("Should revert collection enable if collection not exist in brand", async () => {
        await expect(master.enableCollection("brandName", zeroAddress))
            .to.be.revertedWith("MasterStation: Brand does not have this collection");
    });

    it("Should revert collection enable if sender != owner", async () => {
        await expect(master.connect(accs[2]).enableCollection("brandName", collection.address))
            .to.be.revertedWith("MasterStation: Collection owner only");
    });

    it("Should enable collection", async () => {
        await expect(master.enableCollection("brandName", collection.address))
            .not.be.reverted;
    });

    it("Should revoke all roles when collection disabled", async () => {
        expect((await master.listBrandAdmins("brandName")).length).to.be.eq(1);

        await master.grantBrandAdminRole("brandName", accs[4].address);
        await master.grantCollectionAdminRole("brandName", collection.address, accs[5].address);
        await master.grantCollectionAdminRole("brandName", collection.address, accs[6].address);
        await master.grantCollectionModeratorRole("brandName", collection.address, accs[7].address);
        await master.grantCollectionModeratorRole("brandName", collection.address, accs[8].address);

        expect((await master.listBrandAdmins("brandName")).length).to.be.eq(2);
        expect((await master.listCollectionAdmins("brandName", collection.address)).length).to.be.eq(2);
        expect((await master.listCollectionModerators("brandName", collection.address)).length).to.be.eq(2);

        await expect(master.disableCollection("brandName", collection.address))
            .not.be.reverted;
        
        expect((await master.listBrandAdmins("brandName")).length).to.be.eq(2);
        expect((await master.listCollectionAdmins("brandName", collection.address)).length).to.be.eq(0);
        expect((await master.listCollectionModerators("brandName", collection.address)).length).to.be.eq(0);

        await expect(master.enableCollection("brandName", collection.address))
            .not.be.reverted;

        expect((await master.listBrandAdmins("brandName")).length).to.be.eq(2);
        expect((await master.listCollectionAdmins("brandName", collection.address)).length).to.be.eq(0);
        expect((await master.listCollectionModerators("brandName", collection.address)).length).to.be.eq(0);
    });

    it("Should DEFAULT_ADMIN grant PLATFORM_ADMIN", async () => {
        await expect(master.grantPlatformAdminRole(accs[2].address))
            .not.be.reverted;
    });

    it("Should CHIEF_ADMIN grant PLATFORM_ADMIN", async () => {
        await expect(master.connect(chief).grantPlatformAdminRole(accs[2].address))
            .not.be.reverted;
    });

    it("Should nobody else grant PLATFORM_ADMIN", async () => {
        await expect(master.connect(chief).grantPlatformAdminRole(accs[2].address))
            .not.be.reverted;
        await expect(master.connect(accs[2]).grantPlatformAdminRole(accs[3].address))
            .to.be.revertedWith(
                `AccessControl: account ${accs[2].address.toLowerCase()} is missing role with level ${PLATFORM_ADMIN_ROLE + 1}`
            );

        await expect(master.connect(chief).grantBrandAdminRole("brandName", accs[3].address))
            .not.be.reverted;
        await expect(master.connect(accs[3]).grantPlatformAdminRole(accs[4].address))
            .to.be.revertedWith(
                `AccessControl: account ${accs[3].address.toLowerCase()} is missing role with level ${PLATFORM_ADMIN_ROLE + 1}`
            );

        await expect(master.connect(chief).grantCollectionAdminRole("brandName", collection.address, accs[4].address))
            .not.be.reverted;
        await expect(master.connect(accs[4]).grantPlatformAdminRole(accs[5].address))
            .to.be.revertedWith(
                `AccessControl: account ${accs[4].address.toLowerCase()} is missing role with level ${PLATFORM_ADMIN_ROLE + 1}`
            );

        await expect(master.connect(chief).grantCollectionModeratorRole("brandName", collection.address, accs[5].address))
            .not.be.reverted;
        await expect(master.connect(accs[5]).grantPlatformAdminRole(accs[6].address))
            .to.be.revertedWith(
                `AccessControl: account ${accs[5].address.toLowerCase()} is missing role with level ${PLATFORM_ADMIN_ROLE + 1}`
            );

        await expect(master.connect(validator).grantPlatformAdminRole(accs[6].address))
            .to.be.revertedWith(
                `AccessControl: account ${validator.address.toLowerCase()} is missing role with level ${PLATFORM_ADMIN_ROLE + 1}`
            );
    });

    it("Should DEFAULT_ADMIN grant BRAND_ADMIN", async () => {
        await expect(master.grantBrandAdminRole("brandName", accs[2].address))
            .not.be.reverted;
    });

    it("Should CHIEF_ADMIN grant BRAND_ADMIN", async () => {
        await expect(master.connect(chief).grantBrandAdminRole("brandName", accs[2].address))
            .not.be.reverted;
    });

    it("Should PLATFORM_ADMIN grant BRAND_ADMIN", async () => {
        await expect(master.connect(chief).grantPlatformAdminRole(accs[2].address))
            .not.be.reverted;

        await expect(master.connect(accs[2]).grantBrandAdminRole("brandName", accs[3].address))
            .not.be.reverted;
    });

    it("Should nobody else grant BRAND_ADMIN", async () => {
        await expect(master.connect(chief).grantBrandAdminRole("brandName", accs[3].address))
            .not.be.reverted;
        await expect(master.connect(accs[3]).grantBrandAdminRole("brandName", accs[4].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the brand"
            );

        await expect(master.connect(chief).grantCollectionAdminRole("brandName", collection.address, accs[4].address))
            .not.be.reverted;
        await expect(master.connect(accs[4]).grantBrandAdminRole("brandName", accs[5].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the brand"
            );

        await expect(master.connect(chief).grantCollectionModeratorRole("brandName", collection.address, accs[5].address))
            .not.be.reverted;
        await expect(master.connect(accs[5]).grantBrandAdminRole("brandName", accs[6].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the brand"
            );

        await expect(master.connect(validator).grantBrandAdminRole("brandName", accs[7].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the brand"
            );
    });

    it("Should DEFAULT_ADMIN grant COLLECTION_ADMIN", async () => {
        await expect(master.grantCollectionAdminRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should CHIEF_ADMIN grant COLLECTION_ADMIN", async () => {
        await expect(master.connect(chief).grantCollectionAdminRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should PLATFORM_ADMIN grant COLLECTION_ADMIN", async () => {
        await expect(master.connect(chief).grantPlatformAdminRole(accs[2].address))
            .not.be.reverted;

        await expect(master.connect(accs[2]).grantCollectionAdminRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should BRAND_ADMIN grant COLLECTION_ADMIN", async () => {
        await expect(master.connect(chief).grantBrandAdminRole("brandName", accs[2].address))
            .not.be.reverted;

        await expect(master.connect(accs[2]).grantCollectionAdminRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should nobody else grant COLLECTION_ADMIN", async () => {
        await expect(master.connect(chief).grantCollectionAdminRole("brandName", collection.address, accs[4].address))
            .not.be.reverted;
        await expect(master.connect(accs[4]).grantCollectionAdminRole("brandName", collection.address, accs[5].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );

        await expect(master.connect(chief).grantCollectionModeratorRole("brandName", collection.address, accs[5].address))
            .not.be.reverted;
        await expect(master.connect(accs[5]).grantCollectionAdminRole("brandName", collection.address, accs[6].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );

        await expect(master.connect(validator).grantCollectionAdminRole("brandName", collection.address, accs[7].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );
    });

    it("Should DEFAULT_ADMIN grant LIST_MODERATOR", async () => {
        await expect(master.grantCollectionModeratorRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should CHIEF_ADMIN grant LIST_MODERATOR", async () => {
        await expect(master.connect(chief).grantCollectionModeratorRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should PLATFORM_ADMIN grant LIST_MODERATOR", async () => {
        await expect(master.connect(chief).grantPlatformAdminRole(accs[2].address))
            .not.be.reverted;

        await expect(master.connect(accs[2]).grantCollectionModeratorRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should BRAND_ADMIN grant LIST_MODERATOR", async () => {
        await expect(master.connect(chief).grantBrandAdminRole("brandName", accs[2].address))
            .not.be.reverted;

        await expect(master.connect(accs[2]).grantCollectionModeratorRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;
    });

    it("Should COLLECTION_ADMIN grant LIST_MODERATOR", async () => {
        await expect(master.connect(chief).grantCollectionAdminRole("brandName", collection.address, accs[2].address))
            .not.be.reverted;

        await expect(master.connect(accs[2]).grantCollectionModeratorRole("brandName", collection.address, accs[3].address))
            .not.be.reverted;
    });

    it("Should nobody else grant LIST_MODERATOR", async () => {
        await expect(master.connect(chief).grantCollectionModeratorRole("brandName", collection.address, accs[5].address))
            .not.be.reverted;
        await expect(master.connect(accs[5]).grantCollectionModeratorRole("brandName", collection.address, accs[6].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );

        await expect(master.connect(validator).grantCollectionModeratorRole("brandName", collection.address, accs[7].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );
    });

    it("Should BRAND_ADMIN cant grant COLLECTION_ADMIN or LIST_MODERATOR in other brand", async () => {
        await cbcoin.mint(accs[4].address, 1);
        await cbcoin.connect(accs[4]).approve(master.address, 1);

        const _createCollectionData: CreateCollectionData = {
            brandName: "brandName3",
            creator: accs[4].address,
            supplyLimit: BigNumber.from("1000"),
            paymentAmount: BigNumber.from("1"),
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

        await master.connect(accs[4]).createCollection(_createCollectionData, [signature]);

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

        await master.connect(accs[4]).deployCollection("brandName3", 0, collectionData);
        await expect(master.connect(accs[4]).grantCollectionAdminRole("brandName", collection.address, accs[7].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );
        await expect(master.connect(accs[4]).grantCollectionModeratorRole("brandName", collection.address, accs[7].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );
    });

    it("Should COLLECTION_ADMIN cant grant LIST_MODERATOR in other brand", async () => {
        await cbcoin.mint(accs[4].address, 1);
        await cbcoin.connect(accs[4]).approve(master.address, 1);

        const _createCollectionData: CreateCollectionData = {
            brandName: "brandName3",
            creator: accs[4].address,
            supplyLimit: BigNumber.from("1000"),
            paymentAmount: BigNumber.from("1"),
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

        await master.connect(accs[4]).createCollection(_createCollectionData, [signature]);

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

        await master.connect(accs[4]).deployCollection("brandName3", 0, collectionData);
        const _collection:Collection = await ethers.getContractAt("Collection", (await master.listDeployedBrandCollections("brandName3"))[0], accs[4]);
        await master.grantCollectionAdminRole("brandName3", _collection.address, accs[5].address)

        await expect(master.connect(accs[5]).grantCollectionModeratorRole("brandName", collection.address, accs[7].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );
    });

    it("Should only DEFAULT_ADMIN grant Validator", async () => {
        await expect(master.grantValidatorRole(accs[7].address)).not.be.reverted;
        await expect(master.connect(chief).grantValidatorRole(accs[8].address))
            .to.be.revertedWith(`AccessControl: account ${chief.address.toLowerCase()} is missing role with level ${DEFAULT_ADMIN_ROLE}`);

        await expect(master.revokeValidatorRole(accs[7].address)).not.be.reverted;
    });

    it("Should grantValidator revert if already validator", async () => {
        await expect(master.grantValidatorRole(validator.address))
            .to.be.revertedWith("MasterStation: Already validator");
    });

    it("Should revokeValidator revert if already not validator", async () => {
        await expect(master.revokeValidatorRole(accs[3].address))
            .to.be.revertedWith("MasterStation: Already not validator");
    });

    it("Revoke platform admin", async () => {
        await expect(master.grantPlatformAdminRole(accs[3].address))
            .not.be.reverted;
        expect((await master.listPlatformAdmins()).length).to.be.eq(1);
        await expect(master.connect(accs[4]).revokePlatformAdminRole(accs[3].address))
            .to.be.revertedWith(
                `AccessControl: account ${accs[4].address.toLowerCase()} is missing role with level ${PLATFORM_ADMIN_ROLE + 1}`
            );
        await expect(master.revokePlatformAdminRole(accs[3].address))
            .not.be.reverted;
        expect((await master.listPlatformAdmins()).length).to.be.eq(0);
    });

    it("Revoke brand admin", async () => {
        expect((await master.listBrandAdmins("brandName")).length).to.be.eq(1);
        await expect(master.connect(accs[4]).revokeBrandAdminRole("brandName", signer.address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the brand"
            );
        await expect(master.connect(chief).revokeBrandAdminRole("brandName", signer.address))
            .not.be.reverted;
        expect((await master.listBrandAdmins("brandName")).length).to.be.eq(0);
    });

    it("Revoke collection admin", async () => {
        await master.grantCollectionAdminRole("brandName", collection.address, accs[5].address);

        expect((await master.listCollectionAdmins("brandName", collection.address)).length).to.be.eq(1);
        await expect(master.connect(accs[4]).revokeCollectionAdminRole("brandName", collection.address, accs[5].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );
        await expect(master.connect(chief).revokeCollectionAdminRole("brandName", collection.address, accs[5].address))
            .not.be.reverted;
        expect((await master.listCollectionAdmins("brandName", collection.address)).length).to.be.eq(0);
    });

    it("Revoke list moderator", async () => {
        await master.grantCollectionModeratorRole("brandName", collection.address, accs[5].address);

        expect((await master.listCollectionModerators("brandName", collection.address)).length).to.be.eq(1);
        await expect(master.connect(accs[4]).revokeCollectionModeratorRole("brandName", collection.address, accs[5].address))
            .to.be.revertedWith(
                "MasterStation: Not have access to the collection"
            );
        await expect(master.connect(chief).revokeCollectionModeratorRole("brandName", collection.address, accs[5].address))
            .not.be.reverted;
        expect((await master.listCollectionModerators("brandName", collection.address)).length).to.be.eq(0);
    });

    it("Should purchase CBCoin with token", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: signer.address,
            paymentToken: cbcoin.address,
            paymentAmount: value,
            amountOfCBCOINToPurchase: BigNumber.from(1000),
            deadline: BigNumber.from(Math.floor(Date.now() / 1000) + 10000),
            salt: BigNumber.from(1),
        };
        
        await cbcoin.mint(signer.address, value);
        await cbcoin.approve(master.address, value);
    
        const hash = await payments.getBuyTokensHash(data);
        const fullySignature = await accs[1].signMessage(ethers.utils.arrayify(hash));
        const splittedSignature = ethers.utils.splitSignature(fullySignature);
        const signature = {
            v: splittedSignature.v,
            r: splittedSignature.r,
            s: splittedSignature.s
        }

        await expect(master.purchaseCBCOINWithToken(data, [signature]))
            .to.changeTokenBalances(cbcoin, [signer, payments], [0, value]);
    });

    it("Should purchase CBCoin with ETH", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: signer.address,
            paymentToken: ethers.constants.AddressZero,
            paymentAmount: value,
            amountOfCBCOINToPurchase: BigNumber.from(1000),
            deadline: BigNumber.from(Math.floor(Date.now() / 1000) + 10000),
            salt: BigNumber.from(1),
        };
        
        const hash = await payments.getBuyTokensHash(data);
        const fullySignature = await accs[1].signMessage(ethers.utils.arrayify(hash));
        const splittedSignature = ethers.utils.splitSignature(fullySignature);
        const signature = {
            v: splittedSignature.v,
            r: splittedSignature.r,
            s: splittedSignature.s
        }        
        await expect(master.purchaseCBCOINWithETH(data, [signature], {value: value})).not.be.reverted;
    });

    it("Should purchase CBCoin with ETH and refund excess ETH", async () => {
        await master.grantValidatorRole(accs[1].address);
    
        const value = BigNumber.from(1000);
        const excessValue = BigNumber.from(500);
        const data = {
            receiver: signer.address,
            paymentToken: ethers.constants.AddressZero,
            paymentAmount: value,
            amountOfCBCOINToPurchase: BigNumber.from(1000),
            deadline: BigNumber.from(Math.floor(Date.now() / 1000) + 10000),
            salt: BigNumber.from(1),
        };
        
        const hash = await payments.getBuyTokensHash(data);
        const fullySignature = await accs[1].signMessage(ethers.utils.arrayify(hash));
        const splittedSignature = ethers.utils.splitSignature(fullySignature);
        const signature = {
            v: splittedSignature.v,
            r: splittedSignature.r,
            s: splittedSignature.s
        }

        await expect(() => master.purchaseCBCOINWithETH(data, [signature], {value: value.add(excessValue)}))
            .to.changeEtherBalances([signer, payments], [value.mul(-1), value]);
    });

    it("Should revert receiving ETH", async () => {
        await expect(signer.sendTransaction({
            to: master.address,
            value: 1
        })).to.be.revertedWith("MasterStation: Payments only");
    });
});