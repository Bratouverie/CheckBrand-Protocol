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
} from "../../../common";

export interface TreasuryInterface extends utils.Interface {
  functions: {
    "CBCOIN()": FunctionFragment;
    "CHIEF_ADMIN_ROLE()": FunctionFragment;
    "DEFAULT_ADMIN_ROLE()": FunctionFragment;
    "PLATFORM_ADMIN_ROLE()": FunctionFragment;
    "masterStation()": FunctionFragment;
    "paymentsContractAddress()": FunctionFragment;
    "setPaymentsContractAddress(address)": FunctionFragment;
    "totalSupply()": FunctionFragment;
    "withdraw(address,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "CBCOIN"
      | "CHIEF_ADMIN_ROLE"
      | "DEFAULT_ADMIN_ROLE"
      | "PLATFORM_ADMIN_ROLE"
      | "masterStation"
      | "paymentsContractAddress"
      | "setPaymentsContractAddress"
      | "totalSupply"
      | "withdraw"
  ): FunctionFragment;

  encodeFunctionData(functionFragment: "CBCOIN", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "CHIEF_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PLATFORM_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "masterStation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "paymentsContractAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setPaymentsContractAddress",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "totalSupply",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(functionFragment: "CBCOIN", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "CHIEF_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PLATFORM_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "masterStation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "paymentsContractAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setPaymentsContractAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalSupply",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "PaymentContractSetted(address,address)": EventFragment;
    "Withdrawn(address,uint256,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "PaymentContractSetted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Withdrawn"): EventFragment;
}

export interface PaymentContractSettedEventObject {
  previousAddress: string;
  actualAddress: string;
}
export type PaymentContractSettedEvent = TypedEvent<
  [string, string],
  PaymentContractSettedEventObject
>;

export type PaymentContractSettedEventFilter =
  TypedEventFilter<PaymentContractSettedEvent>;

export interface WithdrawnEventObject {
  receiver: string;
  amount: BigNumber;
  sender: string;
}
export type WithdrawnEvent = TypedEvent<
  [string, BigNumber, string],
  WithdrawnEventObject
>;

export type WithdrawnEventFilter = TypedEventFilter<WithdrawnEvent>;

export interface Treasury extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TreasuryInterface;

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
    CBCOIN(overrides?: CallOverrides): Promise<[string]>;

    CHIEF_ADMIN_ROLE(overrides?: CallOverrides): Promise<[number]>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<[number]>;

    PLATFORM_ADMIN_ROLE(overrides?: CallOverrides): Promise<[number]>;

    masterStation(overrides?: CallOverrides): Promise<[string]>;

    paymentsContractAddress(overrides?: CallOverrides): Promise<[string]>;

    setPaymentsContractAddress(
      _payments: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;

    withdraw(
      receiver: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  CBCOIN(overrides?: CallOverrides): Promise<string>;

  CHIEF_ADMIN_ROLE(overrides?: CallOverrides): Promise<number>;

  DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<number>;

  PLATFORM_ADMIN_ROLE(overrides?: CallOverrides): Promise<number>;

  masterStation(overrides?: CallOverrides): Promise<string>;

  paymentsContractAddress(overrides?: CallOverrides): Promise<string>;

  setPaymentsContractAddress(
    _payments: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

  withdraw(
    receiver: PromiseOrValue<string>,
    amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    CBCOIN(overrides?: CallOverrides): Promise<string>;

    CHIEF_ADMIN_ROLE(overrides?: CallOverrides): Promise<number>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<number>;

    PLATFORM_ADMIN_ROLE(overrides?: CallOverrides): Promise<number>;

    masterStation(overrides?: CallOverrides): Promise<string>;

    paymentsContractAddress(overrides?: CallOverrides): Promise<string>;

    setPaymentsContractAddress(
      _payments: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(
      receiver: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "PaymentContractSetted(address,address)"(
      previousAddress?: PromiseOrValue<string> | null,
      actualAddress?: PromiseOrValue<string> | null
    ): PaymentContractSettedEventFilter;
    PaymentContractSetted(
      previousAddress?: PromiseOrValue<string> | null,
      actualAddress?: PromiseOrValue<string> | null
    ): PaymentContractSettedEventFilter;

    "Withdrawn(address,uint256,address)"(
      receiver?: PromiseOrValue<string> | null,
      amount?: PromiseOrValue<BigNumberish> | null,
      sender?: PromiseOrValue<string> | null
    ): WithdrawnEventFilter;
    Withdrawn(
      receiver?: PromiseOrValue<string> | null,
      amount?: PromiseOrValue<BigNumberish> | null,
      sender?: PromiseOrValue<string> | null
    ): WithdrawnEventFilter;
  };

  estimateGas: {
    CBCOIN(overrides?: CallOverrides): Promise<BigNumber>;

    CHIEF_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    PLATFORM_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    masterStation(overrides?: CallOverrides): Promise<BigNumber>;

    paymentsContractAddress(overrides?: CallOverrides): Promise<BigNumber>;

    setPaymentsContractAddress(
      _payments: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(
      receiver: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    CBCOIN(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    CHIEF_ADMIN_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    DEFAULT_ADMIN_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    PLATFORM_ADMIN_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    masterStation(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    paymentsContractAddress(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setPaymentsContractAddress(
      _payments: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    withdraw(
      receiver: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}