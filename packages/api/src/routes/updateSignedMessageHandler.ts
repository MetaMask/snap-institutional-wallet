import type { IncomingMessage } from 'connect';
import type http from 'http';

import custodianRequests from '../custodian/requests';

export type UpdateSignedMessageRequest = {
  body: {
    intent: string;
  };
} & IncomingMessage;

/**
 * Handles updating a signed message
 * @param req - The request object
 * @param res - The response object
 * @param _next - The next middleware function
 */
export default async function updateSignedMessageHandler(
  req: UpdateSignedMessageRequest,
  res: http.ServerResponse,
  // eslint-disable-next-line @typescript-eslint/ban-types
  _next: Function,
) {
  console.log('updateSignedMessageHandler', req.url, req.body);

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

  // Update the signed message
  await custodianRequests.updateSignedMessage(id, body);

  const updatedSignedMessage = custodianRequests.getSignedMessage(id);

  res.statusCode = 200;
  res.end(JSON.stringify(updatedSignedMessage));
}
