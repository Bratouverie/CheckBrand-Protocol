import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { Payments } from "../../typechain-types/contracts/develompent/finance";
import { Payments__factory } from "../../typechain-types/factories/contracts/develompent/finance";

import { CBCOIN } from "../../typechain-types/contracts/develompent/token";
import { CBCOIN__factory } from "../../typechain-types/factories/contracts/develompent/token";

import { Treasury } from "../../typechain-types/contracts/develompent/finance";
import { Treasury__factory } from "../../typechain-types/factories/contracts/develompent/finance";

import { MockToken } from "../../typechain-types/contracts/develompent/token";
import { MockToken__factory } from "../../typechain-types/factories/contracts/develompent/token";

import { MasterStation } from "../../typechain-types";
import { MasterStation__factory } from "../../typechain-types";

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

const parse = ethers.utils.parseEther;

let cbc: CBCOIN;
let treasury: Treasury;
let master: MasterStation;
let mock: MockToken;
let payments: Payments;
let signer: SignerWithAddress;
let accs: SignerWithAddress[];

const DEFAULT_ADMIN_ROLE = 255;
const CHIEF_ADMIN_ROLE = 224;
const PLATFORM_ADMIN_ROLE = 192;
const BRAND_ADMIN_ROLE = 128;
const COLLECTION_ADMIN_ROLE = 96;
const LIST_MODERATOR_ROLE = 64;

describe("Payments and Treasury", function () {
    
    async function calcHash(data: BuyTokensData) {
        const hash = ethers.utils.keccak256(ethers.utils.solidityPack(
            ["bytes32", "bytes32"],
            [
                await payments.CACHED_DOMAIN_SEPARATOR(),
                ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                        [
                            "bytes32",
                            "address",
                            "address",
                            "uint256",
                            "uint256",
                            "uint256",
                            "uint256"
                        ],
                        [
                            await payments.BUY_TOKENS_TYPE_HASH(),
                            data.receiver,
                            data.paymentToken,
                            data.paymentAmount,
                            data.amountOfCBCOINToPurchase,
                            data.deadline,
                            data.salt,
                        ]
                    )
                )
            ]
        ));
        return hash;
    }

    beforeEach(async () => {
        accs = await ethers.getSigners();
        signer = accs[0];

        master = await new MasterStation__factory(signer).deploy(signer.address, accs[19].address);
        await master.deployed();
        await master.deployTransaction.wait();

        mock = await new MockToken__factory(signer).deploy();
        await mock.deployed();
        await mock.deployTransaction.wait();

        cbc = await new CBCOIN__factory(signer).deploy(master.address, parse("1000000000000"));
        await cbc.deployed();
        await cbc.deployTransaction.wait();

        treasury = await new Treasury__factory(signer).deploy(cbc.address, master.address);
        await treasury.deployed();
        await treasury.deployTransaction.wait();

        payments = await new Payments__factory(signer).deploy(treasury.address, master.address);
        await payments.deployed();
        await payments.deployTransaction.wait();
    
        await cbc.mint(treasury.address, parse("100000000"));

        await treasury.setPaymentsContractAddress(payments.address);

        await master.setCBCOIN(cbc.address);
        await master.setPaymentsContract(payments.address);
    });

    it("Should admin can grant validator role", async () => {
        const account = accs[1].address;
        expect((await master.listValidators()).length).to.be.eq(0);
        await master.grantValidatorRole(account);
        expect((await master.listValidators())[0]).to.be.eq(account);
    });

    it("Should non-admin cant grant validator role", async () => {
        const account = accs[1].address;
        await expect(master.connect(accs[1]).grantValidatorRole(account)).to.be.revertedWith(
            `AccessControl: account ${accs[1].address.toLowerCase()} is missing role with level ${DEFAULT_ADMIN_ROLE}`
        );
    });

    it("Should admin can revoke validator role", async () => {
        const account = accs[1].address;
        await master.grantValidatorRole(account);
        expect((await master.listValidators())[0]).to.be.eq(account);
        await master.revokeValidatorRole(account);
        expect((await master.listValidators()).length).to.be.eq(0);
    });

    it("Should non-admin cant revoke validator role", async () => {
        const account = accs[1].address;
        await master.grantValidatorRole(account);
        await expect(master.connect(accs[2]).revokeValidatorRole(account)).to.be.revertedWith(
            `AccessControl: account ${accs[2].address.toLowerCase()} is missing role with level ${DEFAULT_ADMIN_ROLE}`
        );
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
        await expect(payments.purchaseCBCOINWithETH(data, [signature], {value: value})).not.be.reverted;
    });

    it("Should purchase CBCoin with token", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: signer.address,
            paymentToken: mock.address,
            paymentAmount: value,
            amountOfCBCOINToPurchase: BigNumber.from(1000),
            deadline: BigNumber.from(Math.floor(Date.now() / 1000) + 10000),
            salt: BigNumber.from(1),
        };
        
        await mock.mint(signer.address, value);
        await mock.approve(payments.address, value);
    
        const hash = await payments.getBuyTokensHash(data);
        const fullySignature = await accs[1].signMessage(ethers.utils.arrayify(hash));
        const splittedSignature = ethers.utils.splitSignature(fullySignature);
        const signature = {
            v: splittedSignature.v,
            r: splittedSignature.r,
            s: splittedSignature.s
        }

        await expect(payments.connect(accs[0]).purchaseCBCOINWithToken(data, [signature]))
            .to.changeTokenBalances(mock, [signer, payments], [value.mul(-1), value]);
        expect(await cbc.balanceOf(accs[0].address)).to.be.eq(data.amountOfCBCOINToPurchase);
    });

    it("Should fail to purchase CBCoin with token when payment token is zero address", async () => {
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

        await expect(payments.purchaseCBCOINWithToken(data, [signature]))
            .to.be.revertedWith("Payments: Incorrect payment token address");
    });

    it("Should fail to purchase CBCoin with token when payment amount is zero", async () => {
        await master.grantValidatorRole(accs[1].address);

        const data = {
            receiver: signer.address,
            paymentToken: mock.address,
            paymentAmount: BigNumber.from(0),
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

        await expect(payments.purchaseCBCOINWithToken(data, [signature]))
            .to.be.revertedWith("Payments: Incorrect payment token amount");
    });

    it("Should fail to purchase CBCoin with token when purchased token amount is zero", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: signer.address,
            paymentToken: mock.address,
            paymentAmount: value,
            amountOfCBCOINToPurchase: BigNumber.from(0),
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

        await expect(payments.purchaseCBCOINWithToken(data, [signature]))
            .to.be.revertedWith("Payments: Incorrect purschased token amount");
    });

    it("Should fail to purchase CBCoin with ETH when payment token is non-zero address", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: signer.address,
            paymentToken: mock.address,
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
    
        await expect(payments.purchaseCBCOINWithETH(data, [signature], {value: value}))
            .to.be.revertedWith("Payments: Payment token address should be 0 when using ETH");
    });
    
    it("Should fail to purchase CBCoin with ETH when payment amount is zero", async () => {
        await master.grantValidatorRole(accs[1].address);

        const data = {
            receiver: signer.address,
            paymentToken: ethers.constants.AddressZero,
            paymentAmount: BigNumber.from(0),
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
    
        await expect(payments.purchaseCBCOINWithETH(data, [signature]))
            .to.be.revertedWith("Payments: Incorrect ETH amount");
    });
    
    it("Should fail to purchase CBCoin with ETH when purchased token amount is zero", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: signer.address,
            paymentToken: ethers.constants.AddressZero,
            paymentAmount: value,
            amountOfCBCOINToPurchase: BigNumber.from(0),
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
    
        await expect(payments.purchaseCBCOINWithETH(data, [signature]))
            .to.be.revertedWith("Payments: Incorrect purschased token amount");
    });
    
    it("Should fail to purchase CBCoin with ETH when insufficient ETH sent", async () => {
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
    
        await expect(payments.purchaseCBCOINWithETH(data, [signature], {value: value.sub(1)}))
            .to.be.revertedWith("Payments: Insufficient ETH sent");
    });
    
    it("Should fail to purchase CBCoin with token if incorrect receiver address", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: ethers.constants.AddressZero,
            paymentToken: cbc.address,
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
    
        await expect(payments.purchaseCBCOINWithToken(data, [signature]))
            .to.be.revertedWith("Payments: Incorrect receiver address");
    });

    it("Should fail to purchase CBCoin with ETH if incorrect receiver address", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: ethers.constants.AddressZero,
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
    
        await expect(payments.purchaseCBCOINWithETH(data, [signature], {value: value}))
            .to.be.revertedWith("Payments: Incorrect receiver address");
    });

    it("Should fail to purchase CBCoin if verifications are not enough", async () => {
        await master.grantValidatorRole(accs[1].address);
        await payments.setMinVerificationsCount(2);

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
    
        await expect(payments.purchaseCBCOINWithETH(data, [signature], {value: value}))
            .to.be.revertedWith("Validator: Insufficient number of verifications");
    });

    it("Should purchase CBCoin if verifications are enough", async () => {
        await master.grantValidatorRole(accs[1].address);
        await master.grantValidatorRole(accs[2].address)
        await payments.setMinVerificationsCount(2);

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
        
        const fullySignature2 = await accs[2].signMessage(ethers.utils.arrayify(hash));
        const splittedSignature2 = ethers.utils.splitSignature(fullySignature2);
        const signature2 = {
            v: splittedSignature2.v,
            r: splittedSignature2.r,
            s: splittedSignature2.s
        }

        await expect(payments.purchaseCBCOINWithETH(data, [signature, signature2], {value: value}))
            .not.be.reverted;
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
        
        await expect(() => payments.purchaseCBCOINWithETH(data, [signature], {value: value.add(excessValue)}))
            .to.changeEtherBalances([signer, payments], [value.mul(-1), value]);
    });
    
    it("Should purchase CBCoin to another receiver", async () => {
        await master.grantValidatorRole(accs[1].address);

        const value = BigNumber.from(1000);
        const data = {
            receiver: accs[2].address,
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
        
        const otherBalBefore = await cbc.balanceOf(accs[2].address);
        await expect(() => payments.purchaseCBCOINWithETH(data, [signature], {value: value}))
            .to.changeEtherBalances([signer, payments], [value.mul(-1), value]);
        const otherBalAfter = await cbc.balanceOf(accs[2].address);
        expect(otherBalAfter.sub(otherBalBefore)).to.be.eq(value);
    });

    it("Should admin withdraw funds", async () => {
        const receiver = accs[1];
        const amount1 = BigNumber.from(1000);
        const amount2 = BigNumber.from(1234);

        await mock.mint(payments.address, amount1);
        await master.grantValidatorRole(accs[1].address);

        const data = {
            receiver: signer.address,
            paymentToken: ethers.constants.AddressZero,
            paymentAmount: amount2,
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
        
        await expect(payments.purchaseCBCOINWithETH(data, [signature], {value: amount2})).not.be.reverted;
        await expect(() => payments.withdrawFunds(mock.address, receiver.address))
            .to.changeEtherBalances([payments, receiver], [amount2.mul(-1), amount2]);

        expect(await mock.balanceOf(receiver.address)).to.be.eq(amount1);
        expect(await mock.balanceOf(payments.address)).to.be.eq(0);
    });

    it("Should fail to withdraw funds when not admin", async () => {
        const receiver = accs[1].address;
        await expect(payments.connect(accs[1]).withdrawFunds(mock.address, receiver))
            .to.be.revertedWith("MasterStation: Not have access to the platform");
    });

    it("Should list all validators", async () => {
        await master.grantValidatorRole(accs[1].address);
        await master.grantValidatorRole(accs[2].address);

        const validators = await payments.listValidators();
        expect(validators).to.include.members([accs[1].address, accs[2].address]);
    });

    it("Should withdraw only ETH when the token address is zero", async () => {
        const receiver = accs[1];
        const amount = BigNumber.from(1234);
    
        await master.grantValidatorRole(accs[1].address);
        const data = {
            receiver: signer.address,
            paymentToken: ethers.constants.AddressZero,
            paymentAmount: amount,
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
        
        await expect(payments.purchaseCBCOINWithETH(data, [signature], {value: amount})).not.be.reverted;
        await expect(() => payments.withdrawFunds(ethers.constants.AddressZero, receiver.address))
            .to.changeEtherBalances([payments, receiver], [amount.mul(-1), amount]);
    });
    
    it("Should not withdraw ETH when the balance is zero", async () => {
        const receiver = accs[1];
        const amount = BigNumber.from(1000);
    
        await mock.mint(payments.address, amount);
        await expect(() => payments.withdrawFunds(mock.address, receiver.address))
            .to.changeEtherBalances([payments, receiver], [BigNumber.from(0), BigNumber.from(0)]);
    
        expect(await mock.balanceOf(receiver.address)).to.be.eq(amount);
        expect(await mock.balanceOf(payments.address)).to.be.eq(0);
    });

    it("Should admin set min verifications count", async () => {
        await expect(payments.setMinVerificationsCount(2)).not.be.reverted;
    });

    it("Should revert if non-admin try to set min verifications count", async () => {
        await expect(payments.connect(accs[1]).setMinVerificationsCount(2)).to.be.revertedWith(
            "MasterStation: Not have access to the platform"
        );
    });

    it("Should revert if admin try to set min verifications count to 0", async () => {
        await expect(payments.setMinVerificationsCount(0)).to.be.revertedWith(
            "Validator: Min verifications count should be greater than 0"
        );
    });

    it("Should revert if non-admin try to set payments contract address to treasury", async () => {
        await expect(treasury.connect(accs[2]).setPaymentsContractAddress(ethers.constants.AddressZero))
            .to.be.revertedWith("MasterStation: Not have access to the platform");
    });

    it("Should revert if non-admin try to withdraw from treasury", async () => {
        await expect(treasury.connect(accs[2]).withdraw(ethers.constants.AddressZero, 1))
            .to.be.revertedWith("MasterStation: Not have access to the platform");
    });

    it("Should revert if admin try to withdraw from treasury more tokens than stored", async () => {
        const bal = await treasury.totalSupply();
        await expect(treasury.withdraw(signer.address, bal.add(1)))
            .to.be.revertedWith("Treasury: Insufficient funds");
    });
});