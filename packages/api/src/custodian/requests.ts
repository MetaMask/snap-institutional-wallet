// Simple lifecycle container for all custodian requests

import { TypedData } from 'eip-712';
import fs from 'fs';
import path from 'path';
// located above the src directory
const persistentStorageJsonFile = path.join(__dirname, '../../data/custodian-requests.json');

import { v4 as uuidv4 } from 'uuid';
import accounts from './accounts';

type Transaction = {
    transaction: {
      id: string
      type: string
      from: string
      to: string
      value: string
      gas: string
      gasPrice?: string
      maxPriorityFeePerGas?: string
      maxFeePerGas?: string
      nonce: string
      data: string
      hash: string
      status: {
        finished: boolean
        submitted: boolean
        signed: boolean
        success: boolean
        displayText: string
      }
    }
    metadata: {
      chainId: string
      rpcUrl: string
      custodianPublishesTransaction: boolean
    }
  }
  
  type SignedMessage = {
    id?: string
    version : 'personal_sign' | 'signTypedData_v3' | 'signTypedData_v4'
    message: string | TypedData
    address: string
    signature: string | null
    status: {
      finished: boolean
      signed: boolean
      success: boolean
      displayText: string
    }
  }

class CustodianRequests {
    private signedMessages: SignedMessage[] = [];
    private transactions: Transaction[] = [];

    constructor() {
        this.signedMessages = [];
        this.transactions = [];
    }

    load() {

        // If the file doesn't exist, we should create it, i.e. call save()
        if (!fs.existsSync(persistentStorageJsonFile)) {
            this.save();
            return;
        }

        const data = fs.readFileSync(persistentStorageJsonFile, 'utf8');
        const parsed = JSON.parse(data);
        this.signedMessages = parsed.signedMessages;
        this.transactions = parsed.transactions;
    }

    save() {
        const data = JSON.stringify({ signedMessages: this.signedMessages, transactions: this.transactions });
        fs.writeFileSync(persistentStorageJsonFile, data);
    }

    addSignedMessage(signedMessage: SignedMessage) : string  {
        signedMessage.id = uuidv4();
        this.signedMessages.push(signedMessage);

        this.save();
        return signedMessage.id;
    }

    addTransaction(transaction: Transaction) {
        this.transactions.push(transaction);
        this.save();
    }

    getSignedMessages() {
        return this.signedMessages;
    }

    getSignedMessage(id: string) {
        return this.signedMessages.find((signedMessage) => signedMessage.id === id);
    }

    async updateSignedMessage(id: string, body: { intent: string }) {
        const signedMessage = this.getSignedMessage(id);
        if (!signedMessage) {
            throw new Error(`Signed message with id ${id} not found`);
        }
        if (body.intent === "failed") {
            signedMessage.status.success = false;
            signedMessage.status.finished = true;
            signedMessage.status.displayText = "Failed";
        }

        if (body.intent === "signed") {

            console.log("Signing message", signedMessage.message);
            console.log("Signing message", signedMessage.address);
            signedMessage.signature = await accounts.signMessage(signedMessage.address, signedMessage.message as string);
            signedMessage.status.signed = true;
            signedMessage.status.success = true;
            signedMessage.status.finished = true;
            signedMessage.status.displayText = "Signed";
        }

        this.save();
    }

    getTransaction(id: string) {
        return this.transactions.find((entity) => entity.transaction.id === id);
    }

    getTransactions() {
        return this.transactions;
    }
}

export default new CustodianRequests();