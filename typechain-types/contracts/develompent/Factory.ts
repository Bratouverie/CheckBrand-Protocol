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
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

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

export interface FactoryInterface extends utils.Interface {
  functions: {
    "deployCollection(string,address,uint256,(string,string,string,bytes32,bytes32,uint256,uint96,uint8))": FunctionFragment;
    "deployedCollections(uint256)": FunctionFragment;
    "deployedCollectionsLength()": FunctionFragment;
    "implementation()": FunctionFragment;
    "masterStation()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "deployCollection"
      | "deployedCollections"
      | "deployedCollectionsLength"
      | "implementation"
      | "masterStation"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "deployCollection",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      ICollectionData.CollectionDataStruct
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "deployedCollections",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "deployedCollectionsLength",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "implementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "masterStation",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "deployCollection",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "deployedCollections",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "deployedCollectionsLength",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "implementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "masterStation",
    data: BytesLike
  ): Result;

  events: {
    "CollectionDeployed(string,string,string,address,uint256,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CollectionDeployed"): EventFragment;
}

export interface CollectionDeployedEventObject {
  brand: string;
  name: string;
  symbol: string;
  deployer: string;
  supplyLimit: BigNumber;
  collectionAddress: string;
}
export type CollectionDeployedEvent = TypedEvent<
  [string, string, string, string, BigNumber, string],
  CollectionDeployedEventObject
>;

export type CollectionDeployedEventFilter =
  TypedEventFilter<CollectionDeployedEvent>;

export interface Factory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: FactoryInterface;

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
    deployCollection(
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    deployedCollections(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    deployedCollectionsLength(overrides?: CallOverrides): Promise<[BigNumber]>;

    implementation(overrides?: CallOverrides): Promise<[string]>;

    masterStation(overrides?: CallOverrides): Promise<[string]>;
  };

  deployCollection(
    _brand: PromiseOrValue<string>,
    _creator: PromiseOrValue<string>,
    _supplyLimit: PromiseOrValue<BigNumberish>,
    _data: ICollectionData.CollectionDataStruct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  deployedCollections(
    arg0: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  deployedCollectionsLength(overrides?: CallOverrides): Promise<BigNumber>;

  implementation(overrides?: CallOverrides): Promise<string>;

  masterStation(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    deployCollection(
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: CallOverrides
    ): Promise<string>;

    deployedCollections(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    deployedCollectionsLength(overrides?: CallOverrides): Promise<BigNumber>;

    implementation(overrides?: CallOverrides): Promise<string>;

    masterStation(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    "CollectionDeployed(string,string,string,address,uint256,address)"(
      brand?: PromiseOrValue<string> | null,
      name?: PromiseOrValue<string> | null,
      symbol?: PromiseOrValue<string> | null,
      deployer?: null,
      supplyLimit?: null,
      collectionAddress?: null
    ): CollectionDeployedEventFilter;
    CollectionDeployed(
      brand?: PromiseOrValue<string> | null,
      name?: PromiseOrValue<string> | null,
      symbol?: PromiseOrValue<string> | null,
      deployer?: null,
      supplyLimit?: null,
      collectionAddress?: null
    ): CollectionDeployedEventFilter;
  };

  estimateGas: {
    deployCollection(
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    deployedCollections(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    deployedCollectionsLength(overrides?: CallOverrides): Promise<BigNumber>;

    implementation(overrides?: CallOverrides): Promise<BigNumber>;

    masterStation(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    deployCollection(
      _brand: PromiseOrValue<string>,
      _creator: PromiseOrValue<string>,
      _supplyLimit: PromiseOrValue<BigNumberish>,
      _data: ICollectionData.CollectionDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    deployedCollections(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    deployedCollectionsLength(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    implementation(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    masterStation(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}