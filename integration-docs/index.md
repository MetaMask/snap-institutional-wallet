This document is for crypto custodians looking to integrate with the institutional MetaMask snap.

The institutional snap provides a customized client library that supports custodian APIs. This document is a guide to the API a custodian must have in order for it to be usable with the institutional snap.

## How it works

- A custodian API creates transactions and signed messages with users' Ethereum accounts, accepting arbitrary transaction parameters.
- After the transaction or signed message is created, the custodian provides a link to the request in their own user interface, so that the user can view the request status and details.
- The user can then sign the transaction or signed message through whatever mechanism the custodian provides.
- The snap will poll the custodian's API to check if the transaction or signed message has been signed.
- Once signed, Metamask will broadcast the transaction to the network and yield a receipt to the request originator (e.g. a dapp)

## Basic custodian requirements

- [Authentication](./authentication) via a refresh token and access token mechanism.
- Implementation of the API endpoints specified in [API Overview](./api/index.md).
- A UI for approving and signing transactions that is accessible to the custodian’s users
- The ability to sign transactions and [messages](./signed-messages)
- Manage [nonce and gas](./transactions/gas)

## How to get allowlisted

Please create a pull request on this repository adding your API to the list of allowlisted custodians in [this file](/packages/snap/src/lib/custodian-types/custodianMetadata.ts.)
