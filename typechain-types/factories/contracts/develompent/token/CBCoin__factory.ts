/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  CBCOIN,
  CBCOINInterface,
} from "../../../../contracts/develompent/token/CBCOIN";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IMasterStation",
        name: "_masterStation",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_supplyLimit",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "CHIEF_ADMIN_ROLE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PLATFORM_ADMIN_ROLE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
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
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
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
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
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
    inputs: [],
    name: "masterStation",
    outputs: [
      {
        internalType: "contract IMasterStation",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "supplyLimit",
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
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
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
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
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
] as const;

const _bytecode =
  "0x60a06040523480156200001157600080fd5b5060405162001ae938038062001ae9833981810160405281019062000037919062000220565b6040518060400160405280601381526020017f436865636b4272616e64436f696e5f74657374000000000000000000000000008152506040518060400160405280600881526020017f4342434f494e5f740000000000000000000000000000000000000000000000008152508160039080519060200190620000bb92919062000170565b508060049080519060200190620000d492919062000170565b505050620000f26663d5939ceaa5a960c01b6200016d60201b60201c565b6200010e676039fcc662eae57260c01b6200016d60201b60201c565b8173ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff16815250506200015e67e5d6effae5bcbcdd60c01b6200016d60201b60201c565b8060058190555050506200029d565b50565b8280546200017e906200025d565b90600052602060002090601f016020900481019282620001a25760008555620001ee565b82601f10620001bd57805160ff1916838001178555620001ee565b82800160010185558215620001ee579182015b82811115620001ed578251825591602001919060010190620001d0565b5b509050620001fd919062000201565b5090565b5b808211156200021c57600081600090555060010162000202565b5090565b600080604083850312156200023457600080fd5b825160018060a01b03811681146200024b57600080fd5b80925050602083015190509250929050565b60008160011c905060018216806200027657607f821691505b6020821081036200029757634e487b7160e01b600052602260045260246000fd5b50919050565b608051611829620002c06000396000818161052801526106da01526118296000f3fe608060405234801561001057600080fd5b50600436106101165760003560e01c8063685d34ff116100a25780639dc29fac116100715780639dc29fac146102e7578063a217fddf14610303578063a457c2d714610321578063a9059cbb14610351578063dd62ed3e1461038157610116565b8063685d34ff1461025d57806370a082311461027b57806388aa07c2146102ab57806395d89b41146102c957610116565b806319d1997a116100e957806319d1997a146101a557806323b872dd146101c3578063313ce567146101f3578063395093511461021157806340c10f191461024157610116565b806306fdde031461011b57806307b1d0e414610139578063095ea7b31461015757806318160ddd14610187575b600080fd5b6101236103b1565b60405161013091906111c6565b60405180910390f35b610141610443565b60405161014e9190611220565b60405180910390f35b610171600480360381019061016c9190611253565b610448565b60405161017e919061127f565b60405180910390f35b61018f61046b565b60405161019c9190611292565b60405180910390f35b6101ad610475565b6040516101ba9190611292565b60405180910390f35b6101dd60048036038101906101d891906112a3565b61047b565b6040516101ea919061127f565b60405180910390f35b6101fb6104aa565b6040516102089190611220565b60405180910390f35b61022b60048036038101906102269190611253565b6104b3565b604051610238919061127f565b60405180910390f35b61025b60048036038101906102569190611253565b6104ea565b005b61026561068b565b6040516102729190611220565b60405180910390f35b610295600480360381019061029091906112df565b610690565b6040516102a29190611292565b60405180910390f35b6102b36106d8565b6040516102c09190611302565b60405180910390f35b6102d16106fc565b6040516102de91906111c6565b60405180910390f35b61030160048036038101906102fc9190611253565b61078e565b005b61030b61089d565b6040516103189190611220565b60405180910390f35b61033b60048036038101906103369190611253565b6108a2565b604051610348919061127f565b60405180910390f35b61036b60048036038101906103669190611253565b610919565b604051610378919061127f565b60405180910390f35b61039b6004803603810190610396919061131b565b61093c565b6040516103a89190611292565b60405180910390f35b6060600380546103c09061134e565b80601f01602080910402602001604051908101604052809291908181526020018280546103ec9061134e565b80156104395780601f1061040e57610100808354040283529160200191610439565b820191906000526020600020905b81548152906001019060200180831161041c57829003601f168201915b5050505050905090565b60e081565b6000806104536109c3565b90506104608185856109cb565b600191505092915050565b6000600254905090565b60055481565b6000806104866109c3565b9050610493858285610b94565b61049e858585610c20565b60019150509392505050565b60006012905090565b6000806104be6109c3565b90506104df8185856104d0858961093c565b6104da919061138c565b6109cb565b600191505092915050565b6104fe6760d76ee905af1ba460c01b610e96565b610512678a0da4dc5cecae7d60c01b610e96565b610526677222fb91209af31460c01b610e96565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16637317576560ff61056c6109c3565b6040518363ffffffff1660e01b81526004016105899291906113b8565b60006040518083038186803b1580156105a157600080fd5b505afa1580156105b5573d6000803e3d6000fd5b505050506105cd673c774bca5bf0ccff60c01b610e96565b6105e16711d7c6d03426fb6060c01b610e96565b6105eb8282610e99565b6105ff67ce03b48c3d18986060c01b610e96565b61061367e1fef0aba8c2b5de60c01b610e96565b610627677b11f07df1d6a13860c01b610e96565b61062f61046b565b6005541015610673576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161066a906113db565b60405180910390fd5b61068767bcb1238c40d4357260c01b610e96565b5050565b60c081565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b7f000000000000000000000000000000000000000000000000000000000000000081565b60606004805461070b9061134e565b80601f01602080910402602001604051908101604052809291908181526020018280546107379061134e565b80156107845780601f1061075957610100808354040283529160200191610784565b820191906000526020600020905b81548152906001019060200180831161076757829003601f168201915b5050505050905090565b6107a2677151990ae213f1dd60c01b610e96565b6107b6672cfbadb46c1ff97d60c01b610e96565b6107ca67920c4b1505747c1e60c01b610e96565b6107de6748bc4d326bc8c82b60c01b610e96565b6107e66109c3565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614610853576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161084a90611419565b60405180910390fd5b6108676712546b00b23ec73060c01b610e96565b61087b6790f0672e6d1bec5f60c01b610e96565b61088f6752478a129ddf8d6560c01b610e96565b6108998282610fef565b5050565b60ff81565b6000806108ad6109c3565b905060006108bb828661093c565b905083811015610900576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108f790611457565b60405180910390fd5b61090d82868684036109cb565b60019250505092915050565b6000806109246109c3565b9050610931818585610c20565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610a3a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a31906114bb565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610aa9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610aa09061151f565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92583604051610b879190611292565b60405180910390a3505050565b6000610ba0848461093c565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8114610c1a5781811015610c0c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c0390611583565b60405180910390fd5b610c1984848484036109cb565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610c8f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c86906115c1565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610cfe576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cf590611625565b60405180910390fd5b610d098383836111bc565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905081811015610d8f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d8690611689565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610e7d9190611292565b60405180910390a3610e908484846111c1565b50505050565b50565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610f08576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610eff906116ed565b60405180910390fd5b610f14600083836111bc565b8060026000828254610f26919061138c565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610fd79190611292565b60405180910390a3610feb600083836111c1565b5050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361105e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110559061172b565b60405180910390fd5b61106a826000836111bc565b60008060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050818110156110f0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110e79061178f565b60405180910390fd5b8181036000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555081600260008282540392505081905550600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516111a39190611292565b60405180910390a36111b7836000846111c1565b505050565b505050565b505050565b600060208083528351808285015260005b818110156111f6578281870101516040828701015282810190506111d7565b81811115611208576000604083870101525b506040601f19601f8301168501019250505092915050565b600060208201905060ff8316825292915050565b60008135905060018060a01b038116811461124e57600080fd5b919050565b6000806040838503121561126657600080fd5b61126f83611234565b9150602083013590509250929050565b6000602082019050821515825292915050565b600060208201905082825292915050565b6000806000606084860312156112b857600080fd5b6112c184611234565b92506112cf60208501611234565b9150604084013590509250925092565b6000602082840312156112f157600080fd5b6112fa82611234565b905092915050565b600060208201905060018060a01b038316825292915050565b6000806040838503121561132e57600080fd5b61133783611234565b915061134560208401611234565b90509250929050565b60008160011c9050600182168061136657607f821691505b60208210810361138657634e487b7160e01b600052602260045260246000fd5b50919050565b600082198211156113ad57634e487b7160e01b600052601160045260246000fd5b828201905092915050565b600060408201905060ff8416825260018060a01b03831660208301529392505050565b60208152601c60208201527f4342434f494e3a20537570706c79206c696d697420726561636865640000000060408201526000606082019050919050565b60208152601860208201527f4342434f494e3a20546f6b656e206f776e6572206f6e6c79000000000000000060408201526000606082019050919050565b60208152602560208201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760408201527f207a65726f00000000000000000000000000000000000000000000000000000060608201526000608082019050919050565b60208152602460208201527f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460408201527f726573730000000000000000000000000000000000000000000000000000000060608201526000608082019050919050565b60208152602260208201527f45524332303a20617070726f766520746f20746865207a65726f20616464726560408201527f737300000000000000000000000000000000000000000000000000000000000060608201526000608082019050919050565b60208152601d60208201527f45524332303a20696e73756666696369656e7420616c6c6f77616e636500000060408201526000606082019050919050565b60208152602560208201527f45524332303a207472616e736665722066726f6d20746865207a65726f20616460408201527f647265737300000000000000000000000000000000000000000000000000000060608201526000608082019050919050565b60208152602360208201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260408201527f657373000000000000000000000000000000000000000000000000000000000060608201526000608082019050919050565b60208152602660208201527f45524332303a207472616e7366657220616d6f756e742065786365656473206260408201527f616c616e6365000000000000000000000000000000000000000000000000000060608201526000608082019050919050565b60208152601f60208201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060408201526000606082019050919050565b60208152602160208201527f45524332303a206275726e2066726f6d20746865207a65726f2061646472657360408201527f730000000000000000000000000000000000000000000000000000000000000060608201526000608082019050919050565b60208152602260208201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e60408201527f63650000000000000000000000000000000000000000000000000000000000006060820152600060808201905091905056fea26469706673582212200d19dabddcd8c4a272b35b860e2bdfa896aa468077d10100bed1b34bd1a0e47664736f6c634300080d0033";

type CBCOINConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CBCOINConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CBCOIN__factory extends ContractFactory {
  constructor(...args: CBCOINConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _masterStation: PromiseOrValue<string>,
    _supplyLimit: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<CBCOIN> {
    return super.deploy(
      _masterStation,
      _supplyLimit,
      overrides || {}
    ) as Promise<CBCOIN>;
  }
  override getDeployTransaction(
    _masterStation: PromiseOrValue<string>,
    _supplyLimit: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _masterStation,
      _supplyLimit,
      overrides || {}
    );
  }
  override attach(address: string): CBCOIN {
    return super.attach(address) as CBCOIN;
  }
  override connect(signer: Signer): CBCOIN__factory {
    return super.connect(signer) as CBCOIN__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CBCOINInterface {
    return new utils.Interface(_abi) as CBCOINInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): CBCOIN {
    return new Contract(address, _abi, signerOrProvider) as CBCOIN;
  }
}
