/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IProxiedCollection,
  IProxiedCollectionInterface,
} from "../../../../../contracts/develompent/interfaces/token/IProxiedCollection";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_masterStation",
        type: "address",
      },
      {
        internalType: "string",
        name: "_brand",
        type: "string",
      },
      {
        internalType: "address",
        name: "_creator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_supplyLimit",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string",
          },
          {
            internalType: "string",
            name: "baseURI",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "whitelist",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "bookingList",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "publicMintTokensLimit",
            type: "uint256",
          },
          {
            internalType: "uint96",
            name: "earnings",
            type: "uint96",
          },
          {
            internalType: "enum ICollectionData.MintStage",
            name: "mintStage",
            type: "uint8",
          },
        ],
        internalType: "struct ICollectionData.CollectionData",
        name: "_data",
        type: "tuple",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IProxiedCollection__factory {
  static readonly abi = _abi;
  static createInterface(): IProxiedCollectionInterface {
    return new utils.Interface(_abi) as IProxiedCollectionInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IProxiedCollection {
    return new Contract(address, _abi, signerOrProvider) as IProxiedCollection;
  }
}
