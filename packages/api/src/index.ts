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
import listRequestsHandler from './routes/listRequestsHandler';
import tokenHandler from './routes/token-handler';
import type { UpdateSignedMessageRequest } from './routes/updateSignedMessageHandler';
import updateSignedMessageHandler from './routes/updateSignedMessageHandler';
import type { UpdateTransactionRequest } from './routes/updateTransactionHandler';
import updateTransactionHandler from './routes/updateTransactionHandler';
import clearRequestsHandler from './routes/clearRequestsHandler';

dotenv.config();

// Load the custodian requests from the persistent storage
custodianRequests.load();

// We don't have access to the connect app here so we build a crude router

/**
 * Logs the URL and body of the request
 * @param req - The incoming HTTP request
 * @param res - The HTTP response object
 * @param _res
 * @param next - Function to pass control to the next middleware
 */
async function logUrlAndBody(
  req: IncomingMessage,
  _res: http.ServerResponse,
  next: () => void,
) {
  const { body } = req as unknown as { body: unknown };
  console.log(req.url);
  console.log(body);
  next();
}

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
 * @param req - The incoming HTTP request
 * @param res - The HTTP response object
 * @param next - Function to pass control to the next middleware
 */
async function router(
  req: IncomingMessage,
  res: http.ServerResponse,
  next: () => void,
) {
  if (req.url!.startsWith('/oauth/token')) {
    return tokenHandler(req, res, next);
  }

  if (req.url!.startsWith('/v3/json-rpc')) {
    return next();
  }

  if (req.url!.startsWith('/list/requests')) {
    return listRequestsHandler(req, res, next);
  }

  if (req.url!.startsWith('/clear/requests')) {
    return clearRequestsHandler(req, res, next);
  }

  if (req.url!.startsWith('/update/signedMessage')) {
    return updateSignedMessageHandler(
      req as UpdateSignedMessageRequest,
      res,
      next,
    );
  }

  if (req.url!.startsWith('/update/transaction')) {
    return updateTransactionHandler(req as UpdateTransactionRequest, res, next);
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
          middleware: [logUrlAndBody, router],
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
