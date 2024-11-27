/* eslint-disable import/no-nodejs-modules */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { OpenrpcDocument } from '@open-rpc/meta-schema';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import type { ServerOptions } from '@open-rpc/server-js';
import { Server } from '@open-rpc/server-js';
import type { HTTPServerTransportOptions } from '@open-rpc/server-js/build/transports/http';
import type { IncomingMessage } from 'connect';
import dotenv from 'dotenv';
import type http from 'http';

import custodianRequests from './custodian/requests';
import { methodMapping } from './method-mapping';
import doc from './openrpc.json';
import tokenHandler from './routes/token-handler';
import type { UpdateSignedMessageRequest } from './routes/updateSignedMessageHandler';
import updateSignedMessageHandler from './routes/updateSignedMessageHandler';

dotenv.config();

// Load the custodian requests from the persistent storage
custodianRequests.load();

// We don't have access to the connect app here so we build a crude router

/*
 * /v3/json-rpc -> JSON-RPC server for ECA-3
 * /oauth/token -> OAuth server
 * /update/signedMessage/{id} -> Update signed message
 * /update/transaction/{id} -> Update transaction
 * /anything-else -> 404
 */

/**
 * Routes incoming HTTP requests to the appropriate handler based on the URL path.
 * 
 * @param req The incoming HTTP request
 * @param res The HTTP response object
 * @param next Function to pass control to the next middleware
 */
async function router(
  req: IncomingMessage,
  res: http.ServerResponse,
  next: () => void,
) {
  console.log(req.url);

  if (req.url!.startsWith('/oauth/token')) {
    return tokenHandler(req, res, next);
  }

  if (req.url!.startsWith('/v3/json-rpc')) {
    next();
    return;
  }

  if (req.url!.startsWith('/update/signedMessage')) {
    return updateSignedMessageHandler(
      req as UpdateSignedMessageRequest,
      res,
      next,
    );
  }

  // Otherwise, 404
  res.statusCode = 404;
  res.end();
}

/**
 * Starts the API server.
 */
export async function start() {
  const serverOptions: ServerOptions = {
    openrpcDocument: await parseOpenRPCDocument(doc as OpenrpcDocument),
    transportConfigs: [
      {
        type: 'HTTPTransport',
        options: {
          port: 3330,
          middleware: [router],
        } as HTTPServerTransportOptions,
      },
    ],
    methodMapping,
  };

  console.log('Starting Server'); // tslint:disable-line
  const server = new Server(serverOptions);

  server.start();
}

start();
