/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IPayments,
  IPaymentsInterface,
} from "../../../../../contracts/develompent/interfaces/finance/IPayments";

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "brandName",
            type: "string",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "supplyLimit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "paymentAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "salt",
            type: "uint256",
          },
        ],
        internalType: "struct IValidator.CreateCollectionData",
        name: "_data",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "v",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct IValidator.Signature[]",
        name: "_signatures",
        type: "tuple[]",
      },
    ],
    name: "paymentForTheCreationOfACollection",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "receiver",
            type: "address",
          },
          {
            internalType: "address",
            name: "paymentToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "paymentAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOfCBCOINToPurchase",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "salt",
            type: "uint256",
          },
        ],
        internalType: "struct IValidator.BuyTokensData",
        name: "_data",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "v",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct IValidator.Signature[]",
        name: "_signatures",
        type: "tuple[]",
      },
    ],
    name: "purchaseCBCOINWithETH",
    outputs: [
      {
        internalType: "uint256",
        name: "residue",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "receiver",
            type: "address",
          },
          {
            internalType: "address",
            name: "paymentToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "paymentAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOfCBCOINToPurchase",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "salt",
            type: "uint256",
          },
        ],
        internalType: "struct IValidator.BuyTokensData",
        name: "_data",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "v",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct IValidator.Signature[]",
        name: "_signatures",
        type: "tuple[]",
      },
    ],
    name: "purchaseCBCOINWithToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IPayments__factory {
  static readonly abi = _abi;
  static createInterface(): IPaymentsInterface {
    return new utils.Interface(_abi) as IPaymentsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IPayments {
    return new Contract(address, _abi, signerOrProvider) as IPayments;
  }
}
