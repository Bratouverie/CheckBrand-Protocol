/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  ITreasury,
  ITreasuryInterface,
} from "../../../../../contracts/develompent/interfaces/finance/ITreasury";

const _abi = [
  {
    inputs: [],
    name: "CBCOIN",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class ITreasury__factory {
  static readonly abi = _abi;
  static createInterface(): ITreasuryInterface {
    return new utils.Interface(_abi) as ITreasuryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ITreasury {
    return new Contract(address, _abi, signerOrProvider) as ITreasury;
  }
}
