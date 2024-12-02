import type { IncomingMessage } from 'connect';
import type http from 'http';

import custodianRequests from '../custodian/requests';

export type UpdateTransactionRequest = {
  body: {
    intent: string;
  };
} & IncomingMessage;

/**
 * Handles updating a transaction
 * @param req - The request object
 * @param res - The response object
 * @param _next - The next middleware function
 */
export default async function updateTransactionHandler(
  req: UpdateTransactionRequest,
  res: http.ServerResponse,
  // eslint-disable-next-line @typescript-eslint/ban-types
  _next: Function,
) {
  console.log('updateTransactionHandler', req.url, req.body);

  // Extract the id from the url
  const id = req.url?.split('/').pop();
  if (!id) {
    res.statusCode = 400;
    res.end('Missing id');
    return;
  }

  // jsonParser is run before this handler so we can access the body
  const { body } = req;

  if (!body) {
    res.statusCode = 400;
    res.end('Missing body');
    return;
  }

  // Update the transaction
  await custodianRequests.updateTransaction(id, body);

  const updatedTransaction = custodianRequests.getTransaction(id);

  res.statusCode = 200;
  res.end(JSON.stringify(updatedTransaction));
}
