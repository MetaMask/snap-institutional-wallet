import { IncomingMessage } from 'connect';
import http from 'http';

import custodianRequests from '../custodian/requests';

export interface UpdateSignedMessageRequest extends IncomingMessage {
  body: {
    intent: string;
  };
}

export default async function updateSignedMessageHandler(
  req: UpdateSignedMessageRequest,
  res: http.ServerResponse,
  next: Function,
) {
  console.log('updateSignedMessageHandler', req.url);

  // Extract the id from the url
  const id = req.url!.split('/').pop();
  if (!id) {
    res.statusCode = 400;
    res.end('Missing id');
    return;
  }

  // jsonParser is run before this handler so we can access the body
  const body = req.body;
  if (!body) {
    res.statusCode = 400;
    res.end('Missing body');
    return;
  }

  // Update the signed message
  await custodianRequests.updateSignedMessage(id, body);

  const updatedSignedMessage = custodianRequests.getSignedMessage(id);

  res.statusCode = 200;
  return res.end(JSON.stringify(updatedSignedMessage));
}
