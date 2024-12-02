## JSON-RPC Errors

JSON-RPC responses must contain either an `error` or a `result` property. Here's an example of a JSON-RPC response with an error:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "The transaction was rejected due to insufficient funds"
  },
  "id": 30
}
```

HTTP status codes other than 200 are not semantically meaningful in JSON-RPC. The HTTP status code should be 200, and the error should be returned in the JSON-RPC response.

!!! info
Relevant JSON-RPC method: `custodian_createTransaction`

### Transaction creation errors

If the user is unable to propose a transaction using a custodial account, for example due to policy settings on the custodial side, an informative error should be returned.

This error is displayed to the user in the extension UI, and the user is not able to proceed with the transaction.

![Example error](../../assets/images/error.png)

### Error code

The error code should be one of the following for these standard errors from the [JSON-RPC specification](https://www.jsonrpc.org/specification):

| Code   | Description      | Meaning                                                                                               |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| -32700 | Parse error      | Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text. |
| -32600 | Invalid Request  | The JSON sent is not a valid Request object.                                                          |
| -32601 | Method not found | The method does not exist / is not available.                                                         |
| -32602 | Invalid params   | Invalid method parameter(s).                                                                          |
| -32603 | Internal error   | Internal JSON-RPC error.                                                                              |

Particularly important is the `-32601 Method not found error`, as it dictates the extension behaviour in the event that some methods are unimplemented. For example, the endpoints to do with signed messages. If the custodian is not implementing any of the methods in the Ethereum Custodian API specification, they should return this error.

For custodian-specific or application-specific errors, the error code can be any integer. Ensure that the description of the error is clear and that the different error types that can occur beyond the standard errors are covered. Below is an example for additional errors that can be define, however the description shall be adjusted as such that it aligns with the terminologies used within the specific custodian and application.

| Code   | Description                 | Meaning                                                                             |
| ------ | --------------------------- | ----------------------------------------------------------------------------------- |
| -31999 | User not set as an approver | User transacting is not set as an approver on the custodian or application          |
| -31998 | Contract is not whitelisted | Smart contract is not whitelisted for transactions                                  |
| -31997 | Amount exceeds threshold    | Transacting amount exceeds defined threshold as set on the custodian or application |
| -31996 | Network not supported       | Network is not supported by the custodian or application                            |
