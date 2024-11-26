import { Server, ServerOptions } from "@open-rpc/server-js";
import { HTTPServerTransportOptions } from "@open-rpc/server-js/build/transports/http";
import { OpenrpcDocument } from "@open-rpc/meta-schema";
import { parseOpenRPCDocument } from "@open-rpc/schema-utils-js";
import methodMapping from "./method-mapping";
import doc from "./openrpc.json"
import { IncomingMessage } from "connect";
import http from "http";

import dotenv from "dotenv";

dotenv.config();

import tokenHandler from "./routes/token-handler";

import custodianRequests from "./custodian/requests";
import updateSignedMessageHandler, { UpdateSignedMessageRequest } from "./routes/updateSignedMessageHandler";

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

function router(req : IncomingMessage, res : http.ServerResponse, next : Function) {
  console.log(req.url);

  if (req.url!.startsWith("/oauth/token")) {
    return tokenHandler(req, res, next);
  }

  if (req.url!.startsWith("/v3/json-rpc")) {
    next();
    return;
  } 

  if (req.url!.startsWith("/update/signedMessage")) {
    return updateSignedMessageHandler(req as UpdateSignedMessageRequest, res, next);
  }

  // Otherwise, 404
  res.statusCode = 404;
  res.end();
}


export async function start() {
  const serverOptions: ServerOptions = {
    openrpcDocument: await parseOpenRPCDocument(doc as OpenrpcDocument),
    transportConfigs: [
      {
        type: "HTTPTransport",
        options: {
          port: 3330,
          middleware: [router],
        } as HTTPServerTransportOptions,
      },
    ],
    methodMapping,
  };

  console.log("Starting Server"); // tslint:disable-line
  const s = new Server(serverOptions);

  s.start();
}

start();