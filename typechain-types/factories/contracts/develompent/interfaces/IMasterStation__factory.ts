/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IMasterStation,
  IMasterStationInterface,
} from "../../../../contracts/develompent/interfaces/IMasterStation";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_brand",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "checkAccessToBrand",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_brand",
        type: "string",
      },
      {
        internalType: "address",
        name: "_collection",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "_role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "checkAccessToCollection",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "checkAccessToPlatform",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_brand",
        type: "string",
      },
      {
        internalType: "address",
        name: "_collection",
        type: "address",
      },
    ],
    name: "checkCollectionByBrand",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_brand",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "hasAccessToBrand",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_brand",
        type: "string",
      },
      {
        internalType: "address",
        name: "_collection",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "_role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "hasAccessToCollection",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "hasAccessToPlatform",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_collectin",
        type: "address",
      },
    ],
    name: "isCollectionEnabled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "isValidator",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "listValidators",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class IMasterStation__factory {
  static readonly abi = _abi;
  static createInterface(): IMasterStationInterface {
    return new utils.Interface(_abi) as IMasterStationInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IMasterStation {
    return new Contract(address, _abi, signerOrProvider) as IMasterStation;
  }
}
