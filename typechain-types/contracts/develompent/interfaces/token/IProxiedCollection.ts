/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../../common";

export declare namespace ICollectionData {
  export type CollectionDataStruct = {
    name: PromiseOrValue<string>;
    symbol: PromiseOrValue<string>;
    baseURI: PromiseOrValue<string>;
    whitelist: PromiseOrValue<BytesLike>;
    bookingList: PromiseOrValue<BytesLike>;
    publicMintTokensLimit: PromiseOrValue<BigNumberish>;
    earnings: PromiseOrValue<BigNumberish>;
    mintStage: PromiseOrValue<BigNumberish>;
  };

  export type CollectionDataStructOutput = [
    string,
    string,
    string,
    string,
    string,
    BigNumber,
    BigNumber,
    number
  ] & {
    name: string;
    symbol: string;
    baseURI: string;
    whitelist: string;
    bookingList: string;
    publicMintTokensLimit: BigNumber;
    earnings: BigNumber;
    mintStage: number;
  };
}

export interface IProxiedCollectionInterface extends utils.Interface {
  functions: {
    "initialize(address,string,address,uint256,(string,string,string,bytes32,bytes32,uint256,uint96,uint8))": FunctionFragment;
  };

  getFunction(nameOrSignatureOrTopic: "initialize"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "initialize",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      ICollectionData.CollectionDataStruct
    ]
  ): string;

  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;

  events: {};
}

export interface IProxiedCollection extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IProxiedCollectionInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    initialize(
      _masterStation: PromiseOrValue<string>,
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  initialize(
    _masterStation: PromiseOrValue<string>,
    _brand: PromiseOrValue<string>,
    _creator: PromiseOrValue<string>,
    _supplyLimit: PromiseOrValue<BigNumberish>,
    _data: ICollectionData.CollectionDataStruct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    initialize(
      _masterStation: PromiseOrValue<string>,
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    initialize(
      _masterStation: PromiseOrValue<string>,
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    initialize(
      _masterStation: PromiseOrValue<string>,
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
