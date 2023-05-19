import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers/lib/utils";
import { ethers } from "hardhat";        
import { BigNumber } from "ethers";                  

const zeroHash = ethers.constants.HashZero;

export interface InputRoyaltySettings {
    investorFee: BigNumber,
    creators: string[],
    creatorsFees: BigNumber[]
}

export interface InputPaymentSettings {
    paymentToken: string,
    paymentAmount: BigNumber,
    paymentReceivers: string[],
    receiversShares: BigNumber[]
}

export interface BookingList {
    account: string,
    tokneId: BigNumber,
    royaltySettings: InputRoyaltySettings,
    paymentSettings: InputPaymentSettings
}

export interface Whitelist {
    account: string,
    mintLimit: BigNumber
}

export function calcTree(bytes32: string[]) {
    try {
        return new MerkleTree(bytes32, keccak256, { sortPairs: true });
    } catch (e) { throw Error(`caclRoot error as ${e}`); }
}

export function getProofByHash(merkletree: MerkleTree, bytes32: string) {
    try {
        return merkletree.getHexProof(bytes32);
    } catch (e) { throw Error(`getProof error as ${e}`); }
}

export function getProofByBookingData(merkletree: MerkleTree, bookingData: BookingList) {
    return getProofByHash(merkletree, keccakB(bookingData)[0]);
}

export function getProofByWhitelistData(merkletree: MerkleTree, whitelistData: Whitelist) {
    return getProofByHash(merkletree, keccakWL(whitelistData));
}

export function getBytes32WhitelistArray(whitelistData: Whitelist[]) {
    try {
        let bytes32: string[] = [];
        for (let i = 0; i < whitelistData.length; i++) bytes32.push(keccakWL(whitelistData[i]));
        return bytes32;
    } catch (e) { throw Error(`getBytes32WhitelistArray error as ${e}`); }
}

export function getBytes32BookingArray(bookingData: BookingList[]) {
    try {
        let bytes32: string[] = [];
        for (let i = 0; i < bookingData.length; i++) bytes32.push(keccakB(bookingData[i])[0]);
        return bytes32;
    } catch (e) { throw Error(`toBytes32FromAddresses error as ${e}`); }
}

export function keccakB(bookingData: BookingList) {
    const abiCoder = ethers.utils.defaultAbiCoder;
    const royaltyHash = ethers.utils.keccak256(abiCoder.encode(
        ["address[]", "uint96[]", "uint96"],
        [
            bookingData.royaltySettings.creators,
            bookingData.royaltySettings.creatorsFees,
            bookingData.royaltySettings.investorFee
        ]
    ));
    const paymentHash = ethers.utils.keccak256(abiCoder.encode(
        ["address", "uint256"],
        [
            bookingData.paymentSettings.paymentToken,
            bookingData.paymentSettings.paymentAmount
        ]
    ));
    const receiversHash = ethers.utils.keccak256(abiCoder.encode(
        ["address[]", "uint96[]"],
        [
            bookingData.paymentSettings.paymentReceivers,
            bookingData.paymentSettings.receiversShares
        ]
    ));
    
    const sumHash = ethers.utils.keccak256(abiCoder.encode(
        ["address", "uint256", "bytes32", "bytes32", "bytes32"],
        [
            bookingData.account,
            bookingData.tokneId,
            royaltyHash,
            paymentHash,
            receiversHash
        ]
    ));
    return [sumHash, royaltyHash, paymentHash, receiversHash];
}

export function keccakWL(whitelistData: Whitelist) {
    const abiCoder = ethers.utils.defaultAbiCoder;
    const sumHash = ethers.utils.keccak256(abiCoder.encode(
        ["address", "uint256"],
        [
            whitelistData.account,
            whitelistData.mintLimit
        ]
    ));

    return sumHash;
}

export function calcRoots(
    whitelistData: Whitelist[],
    bookingData: BookingList[]
) {
    try {
        const trees = getTrees(whitelistData, bookingData);
        return [trees[0].getRoot(), trees[1].getRoot()];
    } catch (e) { throw Error(`calcRoots error as ${e}`); }
}

export function getTrees(
    whitelistData: Whitelist[],
    bookingData: BookingList[]
) {
    try {
        const bytes32Booking: string[] = getBytes32BookingArray(bookingData);
        const BookingTree = calcTree(bytes32Booking);

        const bytes32WL: string[] = getBytes32WhitelistArray(whitelistData);
        const WhitelistTree = calcTree(bytes32WL);

        return [WhitelistTree, BookingTree];
    } catch (e) { throw Error(`calcRoots error as ${e}`); }
}

export function getRoot(
    merkle: MerkleTree
) {
    const root = merkle.getRoot().toString("hex");
    if (root.length < 1) return zeroHash;
    return "0x" + root;
}