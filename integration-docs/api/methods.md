The methods, parameters and return values of the Ethereum Custodian JSON-RPC API are documented in the [OpenRPC specification](https://consensys-vertical-apps.github.io/ethereum-custodian-api/api-documentation).

A brief description of each method is given below.

## Current ECA-3 methods

- `custodian_listAccounts`
  This will retrieve all the [Ethereum accounts a user can access](../../accounts), including addresses and labels. It is similar to `eth_accounts` on the standard Ethereum provider API, but it wraps each address in metadata.

- `custodian_listAccountChainIds`
  This is used to check which chains are supported for a given address. The custodian is responsible for broadcasting transactions, so this would likely refer to any EVM RPC endpoints the custodian can connect to. One of the distinctions between the custodian API and the ethereum JSON-RPC API is that the custodian API is chain agnostic - otherwise this is similar to `eth_chainId`.

- `custodian_createTransaction`
  This is used to create a transaction, with the expectation that it will be signed and broadcasted. It accepts parameters similar to `eth_sendTransaction`, but it also accepts a `chainId` parameter. This is used to determine which chain the transaction should be broadcasted to. [More about transactions](../../transactions/overview).

- `custodian_getTransactionById`
  This is used to obtain transaction metadata, such as the status and hash, from the ID returned by `custodian_createTransaction`. It is used to poll for the status of a transaction in the event that the webhook mechanism is not functioning.

- `custodian_getTransactionLink`
  This returns a URL and a call to action that will be shown to the user after they confirm the transaction in the extension. Typically this URL would be of a web page in the custodian UI where the transaction can be approved. [More about transaction links](../../deeplink).

- `custodian_getSignedMessageLink`
  This returns a URL and a call to action that will be shown to the user after they confirm a signed message request in the extension. Typically this URL would be of a web page in the custodian UI where the signed message can be approved. [More about transaction links](../../deeplink).

- `custodian_sign`
  This is used to create a signed message, accepting a string. This method is equivalent to `personal_sign` in the ethereum provider API. The method returns a signed message ID. [More about signed messages](../../signed-messages).

- `custodian_signTypedData`
  Used to create a signed message, accepting an object which will be encoded according to EIP-712. This method is equivalent to `eth_signTypedData` in the ethereum provider API The method returns a signed message ID. [More about signed messages](../../signed-messages).

- `custodian_getSignedMessageById`
  Used to poll signed message status, and the signature of signed messages created with `custodian_sign` and `custodian_signTypedData`.

## ECA-3 methods currently not supported

- `custodian_getCustomerProof`
  A JSON-RPC method which issues a token on behalf of the custodian.

- `custodian_listAccountsSigned`
  A signed message containing the list of accounts. See `custodian_getCustomerProof`, as it is signed by the same key.

- `custodian_replaceTransaction`
  This can be used to replace a "stuck" transaction that has been submitted but not mined.
