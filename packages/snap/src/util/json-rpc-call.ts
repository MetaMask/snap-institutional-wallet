import type { JsonRpcError } from '../lib/types/JsonRpcError';
import type { JsonRpcResult } from '../lib/types/JsonRpcResult';

/**
 * Factory function to create a JSON-RPC call function.
 * @param jsonRpcEndpoint - The JSON-RPC endpoint.
 * @returns The JSON-RPC call function.
 */
// eslint-disable-next-line import/no-anonymous-default-export
export default function (jsonRpcEndpoint: string) {
  let requestId = 0;

  return async function jsonRpcCall<Params, Result>(
    method: string,
    params: Params,
    accessToken: string,
  ): Promise<Result> {
    let response: Response;
    let responseJson;

    requestId += 1;

    console.debug('JSON-RPC >', method, requestId, params, jsonRpcEndpoint);

    try {
      response = await fetch(jsonRpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method,
          params,
        }),
        credentials: 'same-origin', // this is the default value for "withCredentials" in the Fetch API
      });

      responseJson = await response.json();

      if ((responseJson as JsonRpcError).error) {
        console.error(
          'JSON-RPC <',
          method,
          requestId,
          responseJson,
          jsonRpcEndpoint,
          responseJson,
        );
        throw new Error((responseJson as JsonRpcError).error.message);
      }

      console.debug(
        'JSON-RPC <',
        method,
        requestId,
        (responseJson as JsonRpcResult<any>).result,
        jsonRpcEndpoint,
      );
    } catch (error) {
      // FIXME: Handle the various error types
      // TODO: How do we handle an expired token?

      console.log('JSON-RPC <', method, requestId, error, jsonRpcEndpoint);
      console.error(error);

      throw error;
    }

    return responseJson;
  };
}
