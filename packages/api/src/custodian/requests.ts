/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable import/no-nodejs-modules */
// Simple lifecycle container for all custodian requests

import { Common, Hardfork } from '@ethereumjs/common';
import type { JsonTx, TypedTransaction } from '@ethereumjs/tx';
import {
  Transaction as EthereumJsTransaction,
  FeeMarketEIP1559Transaction,
  TransactionFactory,
} from '@ethereumjs/tx';
import type { TypedData } from 'eip-712';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import accounts from './accounts';
import { getTransactionCount } from './get-nonce';
import type { ChainId } from './get-nonce';
// located above the src directory
const persistentStorageJsonFile = path.join(
  __dirname,
  '../../data/custodian-requests.json',
);

type Transaction = {
  transaction: {
    id?: string;
    type: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice?: string;
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
    nonce?: string;
    data: string;
    hash?: string;
    signedRawTransaction?: string;
    status?: {
      finished: boolean;
      submitted: boolean;
      signed: boolean;
      success: boolean;
      displayText: string;
    };
  };
  metadata: {
    chainId: string;
    rpcUrl: string;
    custodianPublishesTransaction: boolean;
  };
};

type SignedMessage = {
  id?: string;
  version: 'personal_sign' | 'signTypedData_v3' | 'signTypedData_v4';
  message: string | TypedData;
  address: string;
  signature: string | null;
  status: {
    finished: boolean;
    signed: boolean;
    success: boolean;
    displayText: string;
  };
};

class CustodianRequests {
  #signedMessages: SignedMessage[] = [];

  #transactions: Transaction[] = [];

  constructor() {
    this.#signedMessages = [];
    this.#transactions = [];
  }

  clearRequests() {
    this.#signedMessages = [];
    this.#transactions = [];
  }

  load() {
    // If the file doesn't exist, we should create it, i.e. call save()
    if (!fs.existsSync(persistentStorageJsonFile)) {
      this.save();
      return;
    }

    const data = fs.readFileSync(persistentStorageJsonFile, 'utf8');
    const parsed = JSON.parse(data);
    this.#signedMessages = parsed.signedMessages;
    this.#transactions = parsed.transactions;
  }

  save() {
    const data = JSON.stringify({
      signedMessages: this.#signedMessages,
      transactions: this.#transactions,
    });
    fs.writeFileSync(persistentStorageJsonFile, data);
  }

  addSignedMessage(signedMessage: SignedMessage): string {
    signedMessage.id = uuidv4();
    this.#signedMessages.push(signedMessage);

    this.save();
    return signedMessage.id;
  }

  addTransaction(transaction: Transaction): string {
    transaction.transaction.id = uuidv4();
    transaction.transaction.status = {
      finished: false,
      submitted: false,
      signed: false,
      success: false,
      displayText: 'Created',
    };
    this.#transactions.push(transaction);
    this.save();
    return transaction.transaction.id;
  }

  getSignedMessages() {
    return this.#signedMessages;
  }

  getSignedMessage(id: string) {
    return this.#signedMessages.find(
      (signedMessage) => signedMessage.id === id,
    );
  }

  listRequests() {
    return {
      signedMessages: this.#signedMessages,
      transactions: this.#transactions,
    };
  }

  async updateSignedMessage(id: string, body: { intent: string }) {
    console.log('updateSignedMessage', id, body);
    const signedMessage = this.getSignedMessage(id);
    if (!signedMessage) {
      throw new Error(`Signed message with id ${id} not found`);
    }
    if (body.intent === 'failed') {
      signedMessage.status.success = false;
      signedMessage.status.finished = true;
      signedMessage.status.displayText = 'Failed';
    }

    if (body.intent === 'signed') {
      console.log('Signing message', signedMessage.message);

      if (signedMessage.version === 'personal_sign') {
        signedMessage.signature = await accounts.signPersonalMessage(
          signedMessage.address,
          signedMessage.message as string,
        );
      } else if (signedMessage.version === 'signTypedData_v4') {
        signedMessage.signature = await accounts.signTypedData(
          signedMessage.address,
          signedMessage.message as string,
        );
      }
      signedMessage.status.signed = true;
      signedMessage.status.success = true;
      signedMessage.status.finished = true;
      signedMessage.status.displayText = 'Signed';
    }

    this.save();
  }

  async updateTransaction(id: string, body: { intent: string }) {
    console.log('updateTransaction', id, body);

    const request = this.getTransaction(id);
    if (!request?.transaction?.status) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    if (body.intent === 'failed') {
      request.transaction.status.success = false;
      request.transaction.status.finished = true;
      request.transaction.status.displayText = 'Failed';
    }

    if (body.intent === 'signed') {
      const signedTransaction = await this.signTransaction(id);
      request.transaction.signedRawTransaction = `0x${Buffer.from(
        signedTransaction.serialize(),
      ).toString('hex')}`;

      request.transaction.hash = `0x${Buffer.from(
        signedTransaction.hash(),
      ).toString('hex')}`;
      request.transaction.nonce = `0x${signedTransaction.nonce.toString(16)}`;

      request.transaction.status.signed = true;
      request.transaction.status.success = true;
      request.transaction.status.finished = true;
      request.transaction.status.displayText = 'Signed';
    }

    this.save();
  }

  getTransaction(id: string) {
    return this.#transactions.find((entity) => entity.transaction.id === id);
  }

  getTransactions() {
    return this.#transactions;
  }

  async signTransaction(id: string): Promise<TypedTransaction> {
    const request = this.getTransaction(id);
    if (!request) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const nonce = await this.getNextNonce(
      request.transaction.from,
      request.metadata.chainId as ChainId,
      id,
    );

    const txParams = {
      to: request.transaction.to,
      value: request.transaction.value,
      data: request.transaction.data,
      gasLimit: request.transaction.gas,
      type: request.transaction.type,
      nonce,
    };

    const common = Common.custom(
      {
        chainId: parseInt(request.metadata.chainId, 16),
        networkId: parseInt(request.metadata.chainId, 16),
      },
      {
        hardfork:
          request.transaction.maxPriorityFeePerGas ||
          request.transaction.maxFeePerGas
            ? Hardfork.London
            : Hardfork.Istanbul,
      },
    );

    let tx;

    if (request.transaction.type === '0x2') {
      tx = TransactionFactory.fromTxData(
        {
          ...txParams,
          maxFeePerGas: request.transaction.maxFeePerGas as string,
          maxPriorityFeePerGas: request.transaction
            .maxPriorityFeePerGas as string,
        } as JsonTx,
        { common },
      );
    } else {
      tx = TransactionFactory.fromTxData(
        {
          ...txParams,
          gasPrice: request.transaction.gasPrice as string,
        } as JsonTx,
        { common },
      );
    }

    const signature = await accounts.signTransaction(
      request.transaction.from,
      tx,
    );

    console.log('signature', signature.toJSON());

    return signature as TypedTransaction;
  }

  async getNextNonce(
    address: string,
    chainId: ChainId,
    thisTransactionId: string,
  ): Promise<string> {
    let nonce;

    console.log('getting next nonce for address', address, chainId);

    const highestLocalNonce = await this.getHighestLocalNonce(
      address,
      chainId,
      thisTransactionId,
    );

    const localNonce = highestLocalNonce
      ? parseInt(highestLocalNonce, 16) + 1
      : 0;

    const transactionCount = await getTransactionCount(address, chainId);

    const blockChainNonce = transactionCount
      ? parseInt(transactionCount, 16)
      : 0;

    console.log(
      `locallNonce: ${localNonce} blockChainNonce: ${blockChainNonce}`,
    );

    if (blockChainNonce === 0 || blockChainNonce > localNonce) {
      console.log('Using blockchain nonce');
      nonce = blockChainNonce;
    } else {
      console.log('Using local nonce');
      nonce = localNonce;
    }

    return `0x${nonce.toString(16)}`;
  }

  /**
   * Gets nonce from the pending transactions
   * @param address
   * @param chainId
   * @param thisTransactionId
   * @returns
   */
  async getHighestLocalNonce(
    address: string,
    chainId: ChainId,
    thisTransactionId: string,
  ): Promise<string | null> {
    // Get all the transactions from the pending transactions
    const transactions = this.getTransactions();

    // Filter out transactions that have no nonce
    let filteredTransactions = transactions.filter(
      (tx) =>
        tx.transaction.nonce !== undefined && tx.transaction.nonce !== null,
    );

    // Filter out the transaction that we are signing
    filteredTransactions = filteredTransactions.filter(
      (tx) => tx.transaction.id !== thisTransactionId,
    );

    // Filter out transactions that are not from the address
    filteredTransactions = filteredTransactions.filter(
      (tx) => tx.transaction.from === address,
    );

    // Filter out transactions that are not from the chainId
    filteredTransactions = filteredTransactions.filter(
      (tx) => tx.metadata.chainId === chainId,
    );

    if (filteredTransactions.length === 0) {
      return null;
    }

    // Find the highest nonce
    const highestNonce = filteredTransactions.reduce((max, tx) => {
      // @ts-expect-error nonce is not typed
      return Math.max(max, parseInt(tx.transaction.nonce, 16));
    }, 0);

    // Hexlify the nonce
    return `0x${highestNonce.toString(16)}`;
  }
}

const custodianRequests = new CustodianRequests();
export default custodianRequests;
