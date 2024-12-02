/* eslint-disable import/no-nodejs-modules */
import type { IncomingMessage } from 'connect';
import type http from 'http';

import custodianRequests from '../custodian/requests';

export type ClearRequestsRequest = IncomingMessage;

/**
 * Handles listing all requests managed by the custodian
 * @param _req
 * @param res
 * @param _next
 */
export default async function clearRequestsHandler(
  _req: IncomingMessage,
  res: http.ServerResponse,
  // eslint-disable-next-line @typescript-eslint/ban-types
  _next: Function,
) {
  custodianRequests.clearRequests();
  res.end(JSON.stringify({ success: true }));
}
