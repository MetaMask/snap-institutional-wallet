# Transactions

!!! info
Relevant JSON-RPC method: `custodian_createTransaction`

![Areas of responsibility - transactions](../../assets/images/transaction-responsibility.png)

MetaMask via the custodial snap creates/proposes transactions to the custodian API, including a proposed gas price. However, custodians may (at their users' request, or automatically) use a different gas price. Custodians are responsible for the ordering of transactions.

## Supporting multiple chains

How to support multiple chains

Supporting the same address on multiple chains is vital for bridging, as cross chain bridges generally allocate assets to the same address on both sides of the bridge. If you implement the Custodian JSON-RPC API, you can support whatever chains you wish.

`custodian_createTransaction`
The custodian_createTransaction method on the Custodian JSON-RPC API takes a second parameter, which includes the property chainId.

This is the network that the user intended to create the transaction on.

This parameter is needed to sign an ethereum transaction, and custodians can also use it to decide where to broadcast the transaction.

`custodian_listAccountChainIds`
A custodian_listAccountChainIds method exists on the Custodian JSON-RPC API which is executed when the extension is unlocked, for each custodian account stored in MMI.

This method takes a single parameter, the ethereum account address in question. Custodians may ignore this parameter if users use their addresses with all their configured chains.

Within the extension, this is used for two purposes:

Preventing users from copying their address when they have an unsupported network selected

Warning users that a specific chain is not supported before they send a transaction
When custodians (or their users) add a new chain, support for this chain can be signalled by adding it to the response for this command.

## Transaction updates

After a transaction is created, the custodian is responsible for updating the transaction status to include the signed raw transaction via the `custodian_getTransactionById` method. The snap will poll this method until the transaction contains a valid signature or the transaction is marked as not successful.

### Rules

- To give users access to the Defi ecosystem, they must have the power to make calls to smart contracts and conduct other types of transactions, such as:

  - ETH transfers.
  - ERC-20 transfers and approves - a special case of smart contract calls.
  - General smart contract calls, i.e. transactions where the `to` parameter is a smart contract address and the data.

- We expect custodians to have their own rules on what contracts their customers can call.

### Parameters

The parameters we send with our HTTP request are similar to the `ITXParams` in the appendices, and closely resemble the parameters of `eth_sendTransaction` in the Ethereum JSON-RPC API. Hexlified string values are necessary for supporting large numbers.

- `from`: the Ethereum address of the user.
- `to`: the Ethereum address of the contract we are calling, or the recipient in the case of a simple transfer.
- `value`: stringified integer of the value sent with this transaction, in Wei.
- `gasLimit`: same as `value`, set by the user, but can be overridden.
- `data`: the calldata, i.e. the 4 byte prefix and the contract method parameters.
- Gas parameters: see the [next section](../gas).

!!! tip "Nonce"
We do not send a nonce. We expect the custodian to manage the nonce as well as publish the transaction. This is essential for avoiding stuck transactions.

## Transactions FAQ

### Who handles gas prices?

See [Gas](../gas).

### Who handles the nonce field?

This must be set by the custodian to facilitate transaction retries. Updated nonces should be included in webhooks and in the response to `custodian_getTransactionById`, as they are used by the extension UI to order transactions.

### Who broadcasts the transaction?

MetaMask broadcasts the transaction.

### How do transaction statuses work?

In transaction methods and webhooks, the `status` field has the following content:

```typescript
{
  finished: boolean;
  signed: boolean;
  submitted: boolean;
  success: boolean;
  displayText: string;
  reason: string;
}
```

#### Subfield explanations

- `finished` - whether the transaction is done, i.e. it is no longer necessary to poll for the status of this transaction. This should be true whether or not the transaction was successful
- `signed` - Whether the transaction has been signed - it has an available hash
- `submitted` - Whether the transaction has been broadcast to an RPC network and made available in the mempool. The custodia should not set this to true unless it is monitoring transactions
- `success` - Whether the transaction was successful - for example it has been validated by a node, and not reverted or rejected
- `displayText` - a short, capitalised name for the transaction status, for example: Pending, Proposed, Rejected, Complete, Failed. This is shown to the user by the extension.
- `reason` - an explanation for the current status. For example “Transaction was rejected by approver”, or if an error was received from an EVM node, this could be included here. This is displayed to the user by the extension if the transaction is not successful.
