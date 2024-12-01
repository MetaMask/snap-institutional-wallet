## Deep Links

!!!	info
	Relevant JSON-RPC method: `custodian_getTransactionLink`

After the user proposes a transaction or signed message using `custodian_createTransaction` or `custodian_sign` or `custodian_signTypedData`, the custodian can provide a link to the request in their own user interface, so that the user can view the request status and details. This may be necessary if the transaction requires approval from the user or other members of the user's organisation. It provides the user with a link to next step to get their transaction signed and broadcasted. It is also used after the creation of signed messages.

When the extension issues the command `custodian_createTransaction` or `custodian_sign` or `custodian_signTypedData`, the custodian must return an ID, which is used to issue the command `custodian_getTransactionLink` or `custodian_getSignedMessageLink`.

### Example response

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "transactionId": "ef8cb7af-1a00-4687-9f82-1f1c82fbef54",
    "url": "https://example.com/transaction/ef8cb7af-1a00-4687-9f82-1f1c82fbef54",
    "text": "Approve your transaction in the custodian interface",
    "showLink": true,
    "action": "Approve",
    "ethereum": {} // Not used
  }
}
```

- The `transactionId` is the ID of the transaction, which should be the same as the parameter of the command message.
- In the case of a signed message the response will contain a `signedMessageId` instead of a `transactionId`.
- The `url` is the URL of the transaction in the custodian's user interface. 
- The `text` is the text that will be displayed to the user. 
- The `action` is the text that will be displayed on the button that will open the URL. 
- `showLink` is whether the link should be shown or not

You must provide the `url` parameter to us when integration so that it can be allowlisted.