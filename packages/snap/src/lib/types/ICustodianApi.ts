import type { EventEmitter } from 'events';

import type {
  IEIP1559TxParams,
  ILegacyTXParams,
  IRefreshTokenAuthDetails,
  IEthereumAccount,
  IEthereumAccountCustodianDetails,
  CreateTransactionMetadata,
  SignedTypedMessageMetadata,
  SignedMessageMetadata,
  CustodianDeepLink,
} from '.';
import type { MessageTypes, TypedMessage } from './ITypedMessage';
import type { ReplaceTransactionParams } from './ReplaceTransactionParams';
import type {
  SignedMessageDetails,
  TransactionDetails,
} from '../structs/CustodialKeyringStructs';

export type ICustodianApi = {
  getListAccountsSigned?(): Promise<string>;

  getEthereumAccounts(
    chainId?: number,
  ): Promise<IEthereumAccount<IEthereumAccountCustodianDetails>[]>;

  getEthereumAccountsByAddress(
    address: string,
    chainId?: number,
  ): Promise<IEthereumAccount<IEthereumAccountCustodianDetails>[]>;

  getEthereumAccountsByLabelOrAddressName(
    name: string,
    chainId?: number,
  ): Promise<IEthereumAccount<IEthereumAccountCustodianDetails>[]>;

  createTransaction(
    txParams: ILegacyTXParams | IEIP1559TxParams,
    txMeta: CreateTransactionMetadata,
  ): Promise<TransactionDetails>;

  replaceTransaction?(
    txParams: ReplaceTransactionParams,
  ): Promise<{ transactionId: string }>;

  getTransaction(
    from: string,
    transactionId: string,
  ): Promise<TransactionDetails | null>;

  // Obtain a JWT from the custodian that we can use to authenticate to
  getCustomerProof(): Promise<string>;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  signTypedData_v4(
    address: string,
    data: TypedMessage<MessageTypes>,
    version: string,
    signedTypedMessageMetadata: SignedTypedMessageMetadata,
  ): Promise<SignedMessageDetails>;

  signPersonalMessage(
    address: string,
    mesage: string,
    signedMessageMetadata: SignedMessageMetadata,
  ): Promise<SignedMessageDetails>;

  getSupportedChains(address?: string): Promise<string[]>;

  getSignedMessageLink(
    signedMessageId: string,
  ): Promise<Partial<CustodianDeepLink> | null>;

  getTransactionLink(
    transactionId: string,
  ): Promise<Partial<CustodianDeepLink> | null>;

  getSignedMessage(
    address: string,
    signatureId: string,
  ): Promise<SignedMessageDetails | null>;

  changeRefreshTokenAuthDetails(authDetails: IRefreshTokenAuthDetails): void;
} & EventEmitter;
