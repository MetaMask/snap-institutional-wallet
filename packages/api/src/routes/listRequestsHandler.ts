import type { IncomingMessage } from 'connect';
import type http from 'http';

import custodianRequests from '../custodian/requests';

export type ListRequestsRequest = IncomingMessage;

/**
 * Handles listing all requests managed by the custodian
 * @param _req
 * @param res
 * @param _next
 */
export default async function listRequestsHandler(
  _req: IncomingMessage,
  res: http.ServerResponse,
  // eslint-disable-next-line @typescript-eslint/ban-types
  _next: Function,
) {
  const requests = custodianRequests.listRequests();
  res.end(JSON.stringify(requests));
}
