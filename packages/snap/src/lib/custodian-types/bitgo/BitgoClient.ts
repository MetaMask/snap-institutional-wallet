import { handleResponse } from '../../../util/handle-response';
import type { IEIP1559TxParams, ILegacyTXParams } from '../../types';
import type { IBitgoCreateTransactionResponse } from './interfaces/IBitgoCreateTransactionResponse';
import type { IBitgoCustomerProof } from './interfaces/IBitgoCustomerProof';
import type { IBitgoEIP712Request } from './interfaces/IBitgoEIP712Request';
import type { IBitgoEIP712Response } from './interfaces/IBitgoEIP712Response';
import type { IBitgoEthereumAccount } from './interfaces/IBitgoEthereumAccount';
import type { IBitgoGetEthereumAccountsResponse } from './interfaces/IBitgoGetEthereumAccountsResponse';
import type { IBitgoPersonalSignRequest } from './interfaces/IBitgoPersonalSignRequest';
import type { IBitgoPersonalSignResponse } from './interfaces/IBitgoPersonalSignResponse';
import type { IBitgoTransaction } from './interfaces/IBitgoTransaction';
import type { IBitgoTxDetails } from './interfaces/IBitgoTxDetails';
import type { TypedMessage, MessageTypes } from '../../types/ITypedMessage';

export class BitgoClient {
  private readonly bitgoApiurl: string;

  private readonly jwt: string;

  constructor(apiUrl: string, jwt: string) {
    this.bitgoApiurl = apiUrl;
    this.jwt = jwt;
  }

  getHeaders(): any['headers'] {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.jwt}`,
    };
  }

  async getEthereumAccounts(): Promise<IBitgoEthereumAccount[]> {
    const headers = this.getHeaders();

    const response = await fetch(`${this.bitgoApiurl}/wallets`, {
      headers,
    });

    const contextErrorMessage = 'Error fetching wallet accounts';
    const accounts: IBitgoGetEthereumAccountsResponse = await handleResponse(
      response,
      contextErrorMessage,
    );
    return accounts.data;
  }

  async getEthereumAccountByAddress(
    address: string,
  ): Promise<IBitgoEthereumAccount | null> {
    const headers = this.getHeaders();

    const response = await fetch(
      `${this.bitgoApiurl}/mmi/wallets/address/${address}`,
      {
        headers,
      },
    );

    const contextErrorMessage = `Error fetching account for address ${address}`;
    const accounts: IBitgoGetEthereumAccountsResponse = await handleResponse(
      response,
      contextErrorMessage,
    );
    if (accounts.data.length && accounts.data[0]) {
      return accounts.data[0];
    }
    return null;
  }

  async createTransaction(
    bitgoTxDetails: IBitgoTxDetails,
    txParams: IEIP1559TxParams | ILegacyTXParams,
  ): Promise<IBitgoTransaction> {
    const headers = this.getHeaders();

    if (txParams.type === '0' || txParams.type === '1') {
      txParams.gasPrice = txParams.gasPrice;
    } else if (txParams.type === '2') {
      txParams.maxPriorityFeePerGas = txParams.maxPriorityFeePerGas;
      txParams.maxFeePerGas = txParams.maxFeePerGas;
    }

    const response = await fetch(
      `${this.bitgoApiurl}/mmi/${bitgoTxDetails.coinId}/wallet/${bitgoTxDetails.walletId}/tx/build`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          txParams,
        }),
      },
    );

    const contextErrorMessage = 'Error creating transaction';
    const resultWrapper: IBitgoCreateTransactionResponse = await handleResponse(
      response,
      contextErrorMessage,
    );
    return resultWrapper.data;
  }

  async getTransaction(
    custodian_transactionId: string,
  ): Promise<IBitgoTransaction | null> {
    const headers = this.getHeaders();

    const response = await fetch(
      `${this.bitgoApiurl}/mmi/wallets/transactions/${custodian_transactionId}`,
      {
        headers,
      },
    );

    const contextErrorMessage = `Error getting transaction with id ${custodian_transactionId}`;
    const transaction = await handleResponse<{ data: IBitgoTransaction[] }>(
      response,
      contextErrorMessage,
    );

    if (transaction.data.length && transaction.data[0]) {
      return transaction.data[0];
    }
    return null;
  }

  async getTransactions(): Promise<IBitgoTransaction[]> {
    const headers = this.getHeaders();

    const response = await fetch(`${this.bitgoApiurl}/custodian/transaction`, {
      headers,
    });

    const contextErrorMessage = 'Error getting transactions';
    const allTransactions = await handleResponse<{ data: IBitgoTransaction[] }>(
      response,
      contextErrorMessage,
    );
    return allTransactions.data;
  }

  async getCustomerProof(): Promise<IBitgoCustomerProof> {
    const headers = this.getHeaders();

    const response = await fetch(`${this.bitgoApiurl}/mmi/customer-proof`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        version: 'n/a',
      }),
    });

    const contextErrorMessage = 'Error getting Customer Proof';
    const customerProof = await handleResponse<IBitgoCustomerProof>(
      response,
      contextErrorMessage,
    );
    return customerProof;
  }

  async signTypedData_v4(
    fromAddress: string,
    message: TypedMessage<MessageTypes>,
    coinId: string,
    walletId: string,
    version: string,
  ): Promise<IBitgoEIP712Response> {
    const headers = await this.getHeaders();

    const payload: IBitgoEIP712Request = {
      address: fromAddress,
      payload: message,
      encodingVersion: version || 'v4',
    };

    const response = await fetch(
      `${this.bitgoApiurl}/mmi/${coinId}/wallet/${walletId}/messages/typed`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers,
      },
    );

    const contextErrorMessage = `Error doing signTypedData from address: ${fromAddress}`;
    const data = await handleResponse<IBitgoEIP712Response>(
      response,
      contextErrorMessage,
    );
    return data;
  }

  async signPersonalMessage(
    fromAddress: string,
    message: string,
    coinId: string,
    walletId: string,
  ): Promise<IBitgoPersonalSignResponse> {
    const headers = await this.getHeaders();

    const payload: IBitgoPersonalSignRequest = {
      address: fromAddress,
      message,
    };

    const response = await fetch(
      `${this.bitgoApiurl}/mmi/${coinId}/wallet/${walletId}/messages/personal`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers,
      },
    );

    const contextErrorMessage = `Error doing signPersonalMessage from address: ${fromAddress}`;
    const data = await handleResponse<IBitgoPersonalSignResponse>(
      response,
      contextErrorMessage,
    );
    return data;
  }

  async getSignedMessage(
    custodian_signedMessageId: string,
    coinId: string,
    walletId: string,
  ): Promise<IBitgoPersonalSignResponse> {
    const headers = await this.getHeaders();

    const response = await fetch(
      `${this.bitgoApiurl}/mmi/${coinId}/wallet/${walletId}/messages/${custodian_signedMessageId}`,
      {
        headers,
      },
    );

    const contextErrorMessage = `Error getting signed message with id ${custodian_signedMessageId}`;
    const data = await handleResponse(response, contextErrorMessage);
    return data as IBitgoPersonalSignResponse;
  }
}
