!!!	info
		Relevant JSON-RPC methods: `custodian_sign` and `custodian_signTypedData`


Many Dapps require users to sign messages. This is usually done to prove ownership of an account, or to prove that the user has agreed to a particular message. The custodian must provide a mechanism for signing messages using the `custodian_sign` and `custodian_signTypedData` methods, which correspond to the `personal_sign` and `eth_signTypedData` methods of the [MetaMask JSON-RPC API](https://docs.metamask.io/guide/signing-data.html).

Signed messages are usually subject to the same approval mechanisms as transactions.

## Signature format

The signature should be included in webhooks and in the response of `custodian_getSignedMessageById` in hex format.

## Deterministic signatures

The signature should be deterministic according to [RFC-6979](https://datatracker.ietf.org/doc/html/rfc6979), meaning that the same message signed by the same account should always produce the same signature. This may be difficult to achieve due to the use of the nonce `k` in the signing process. The custodian should ensure that the same message signed by the same account always produces the same signature.

The need for determinism usually relates to protocols (as in, dapps) that get the user to sign something and then later ask them to sign the same thing again and use this as a form of "account recovery".

For example, dydx, which generates a STARK key from the user's signature to use on their own network. Later, if the user visits the dapp (and the STARK key is not held in localstorage) the user will be asked to sign again and the dapp expects the signature to be the same.

MetaMask doesn't persist signatures; one of the main reasons is that users can import the same accounts to different instances of the extension.

A general convention, and expectation of dapps, is that ethereum signatures are RFC-6979 compliant, which is to say they use a non-random `k` value. This value also cannot be fixed, e.g `5`, or subsequent signatures with the same `k` value will leak private keys, so normally a hash of the private key is used.

This is not possible to achieve per se for secret sharing schemes because it's impossible to hash the private key. 

Most custodians therefore store signatures permanently (and treat a an already-signed payload for a given address as permanently approved).

## Signed Message Status

The status field in the response of `custodian_getSignedMessageById` is an object containing the same subfields as that of `custodian_getTransactionById` but does not include `submitted`


```typescript  
{
    "finished": boolean, // This is true if the message is complete - successfully or otherwise
    "signed": boolean, // This is true if the message has been signed
    "success": boolean, // Success is true if the message was signed successfully
    "reason":  string , // This is the reason for an exceptional state (e.g. a failure), for example "Message was rejected by the approver"
    "displayText": string // Text displayed in the activity list, for example  "Rejected"
}
```