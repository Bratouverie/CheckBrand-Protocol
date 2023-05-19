import { ethers } from "hardhat";
import { expect } from "chai";

import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { 
    Collection, 
    Factory
} from "../../typechain-types";

import { 
    Collection__factory,
    Factory__factory,
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

const parse = ethers.utils.parseEther;
const format = ethers.utils.formatEther;

const supplyLimiy = parse("1000000");

let signer: SignerWithAddress;
let chief: SignerWithAddress;
let validator: SignerWithAddress;
let accs: SignerWithAddress[];

let implementation: string;
let factory: Factory;
let data: CollectionData;

describe("Factory and ProxiedCollection", function () {

    beforeEach(async () => {
        accs = await ethers.getSigners();
        signer = accs[0];

        const collectionImplementation = await new Collection__factory(signer).deploy();
        await collectionImplementation.deployed();
        await collectionImplementation.deployTransaction.wait();

        implementation = collectionImplementation.address;

        factory = await new Factory__factory(signer).deploy(signer.address, implementation);
        await factory.deployed();
        await factory.deployTransaction.wait();

        data = {
            name: "testCollection",
            symbol: "tC",
            baseURI: "https://test",
            whitelist: ethers.constants.HashZero,
            bookingList: ethers.constants.HashZero,
            publicMintTokensLimit: BigNumber.from("1"),
            earnings: BigNumber.from("1000"),
            mintStage: 2
        }
    });

    it("Should revert deploy collection if sender != master", async () => {
        await expect(factory.connect(accs[2]).deployCollection("testBrand", signer.address, 1000, data))
            .to.be.revertedWith("Factory: Master only");
    });

    it("Should deploy collection with collect data", async () => {
        const brand = "testBrand";
        const owner = signer.address;
        const supplyLimit = 1000;

        expect(await factory.deployedCollectionsLength()).to.be.eq(0);
        await factory.deployCollection(brand, owner, supplyLimit, data);
        expect(await factory.deployedCollectionsLength()).to.be.eq(1);

        const collectionAddress = await factory.deployedCollections(0);        
        const collection: Collection = await ethers.getContractAt("Collection", collectionAddress, signer);

        expect(await collection.name()).to.be.eq(data.name);
        expect(await collection.symbol()).to.be.eq(data.symbol);
        expect(await collection.mintStage()).to.be.eq(data.mintStage);
        expect(await collection.bookingList()).to.be.eq(data.bookingList);
        expect(await collection.whitelist()).to.be.eq(data.whitelist);
        expect(await collection.publicMintTokensLimit()).to.be.eq(data.publicMintTokensLimit);
        expect(await collection.earnings()).to.be.eq(data.earnings);

        expect(await collection.supplyLimit()).to.be.eq(supplyLimit);
        expect(await collection.ownedByBrand()).to.be.eq(brand);
        expect(await collection.owner()).to.be.eq(owner);
    });
});