import type { IApiCallLogEntry } from '../lib/types';
import type { JsonRpcError } from '../lib/types/JsonRpcError';
import type { JsonRpcResult } from '../lib/types/JsonRpcResult';

/**
 *
 * @param jsonRpcEndpoint
 * @param emit
 */
export default function (
  jsonRpcEndpoint: string,
  emit: (eventName: string, eventData: IApiCallLogEntry) => void,
) {
  let requestId = 0;

  return async function jsonRpcCall<T1, T2>(
    method: string,
    params: T1,
    accessToken: string,
  ): Promise<T2> {
    let response: Response;
    let responseJson;

    requestId++;

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
    } catch (e) {
      // FIXME: Handle the various error types
      // TODO: How do we handle an expired token?

      console.log('JSON-RPC <', method, requestId, e, jsonRpcEndpoint);
      console.error(e);

      throw e;
    }

    return responseJson;
  };
}
