import { ethers } from "hardhat";
import { expect } from "chai";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { CBCOIN } from "../../typechain-types/contracts/develompent/token/CBCOIN";
import { CBCOIN__factory } from "../../typechain-types/factories/contracts/develompent/token/CBCOIN__factory";
import { MasterStation } from "../../typechain-types";
import { MasterStation__factory } from "../../typechain-types";

let cbc: CBCOIN;
let signer: SignerWithAddress;
let accs: SignerWithAddress[];
let master: MasterStation;

const parse = ethers.utils.parseEther;

const supplyLimit = parse("1000");

const DEFAULT_ADMIN_ROLE = 255;
const CHIEF_ADMIN_ROLE = 224;
const PLATFORM_ADMIN_ROLE = 192;
const BRAND_ADMIN_ROLE = 128;
const COLLECTION_ADMIN_ROLE = 96;
const LIST_MODERATOR_ROLE = 64;

describe("CBCOIN", function () {
    

    beforeEach(async () => {
        accs = await ethers.getSigners();
        signer = accs[0];

        master = await new MasterStation__factory(signer).deploy(signer.address, accs[19].address);
        await master.deployed();
        await master.deployTransaction.wait();

        cbc = await new CBCOIN__factory(signer).deploy(master.address, supplyLimit);
        await cbc.deployed();
        await cbc.deployTransaction.wait();

        await master.setCBCOIN(cbc.address);
    });

    // it("Should have default admin role assigned to initial admin", async () => {
    //     const role = await cbc.getRole(await signer.getAddress());
    //     expect(role).to.equal(adminRoleLevel);
    // });

    it("Should revert if calling mint without DEFAULT_ADMIN_ROLE", async () => {
        const recipient = accs[1].address;
        const amount = parse("100");
        await expect(cbc.connect(accs[1]).mint(recipient, amount)).to.be.revertedWith(
            "MasterStation: Not have access to the platform"
        );
    });

    it("Should revert if calling burn for another address", async () => {
        const amount = ethers.utils.parseEther("100");
        await cbc.mint(accs[1].address, amount);

        await expect(cbc.burn(accs[1].address, amount)).to.be.revertedWith("CBCOIN: Token owner only");
    });

    it("Should mint tokens to an address", async () => {
        const recipient = accs[1].address;
        const amount = ethers.utils.parseEther("100");
        await expect(() => cbc.mint(recipient, amount)).to.changeTokenBalance(cbc, recipient, amount);
    });

    it("Should burn tokens from self", async () => {
        const recipient = accs[1].address;
        const amount = ethers.utils.parseEther("100");
        const burnAmount = ethers.utils.parseEther("50");

        await cbc.mint(recipient, amount);
        await expect(() => cbc.connect(accs[1]).burn(recipient, burnAmount)).to.changeTokenBalance(cbc, recipient, burnAmount.mul(-1));
    });

    it("Should mint revert if supply limit reached", async () => {    
        await expect(cbc.mint(signer.address, supplyLimit.add(1))).to.be.revertedWith("CBCOIN: Supply limit reached");
    });
});