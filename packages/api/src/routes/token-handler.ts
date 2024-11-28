import { IncomingMessage } from 'connect';
import http from 'http';

export default function tokenHandler(
  req: IncomingMessage,
  res: http.ServerResponse,
  next: Function,
) {
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      access_token: '1234567890',
      token_type: 'Bearer',
      expires_in: 3600,
    }),
  );
}
