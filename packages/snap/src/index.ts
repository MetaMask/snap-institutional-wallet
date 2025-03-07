/* eslint-disable @typescript-eslint/no-throw-literal */
import type { JsonRpcRequest } from '@metamask/keyring-api';
import { handleKeyringRequest } from '@metamask/keyring-api';
import {
  type UserInputEvent,
  type OnCronjobHandler,
  type OnUserInputHandler,
  type OnHomePageHandler,
  UnauthorizedError,
  MethodNotFoundError,
} from '@metamask/snaps-sdk';
import type {
  Json,
  OnKeyringRequestHandler,
  OnRpcRequestHandler,
} from '@metamask/snaps-types';
import { assert } from '@metamask/superstruct';

import config from './config';
import { getKeyring, getRequestManager } from './context';
import { renderErrorMessage } from './features/error-message/render';
import { getHomePageContext } from './features/homepage/context';
import {
  eventHandles as homePageEvents,
  prefixEventHandles as homePagePrefixEvents,
} from './features/homepage/events';
import { renderHomePage } from './features/homepage/render';
import { eventHandlers as onboardingEvents } from './features/onboarding/events';
import { renderOnboarding } from './features/onboarding/render';
import type { OnboardingAccount } from './features/onboarding/types';
import type {
  CreateAccountOptions,
  CustodialSnapRequest,
  SignedMessageRequest,
  TransactionRequest,
} from './lib/structs/CustodialKeyringStructs';
import {
  MutableTransactionSearchParameters,
  OnBoardingRpcRequest,
  ConnectionStatusRpcRequest,
} from './lib/structs/CustodialKeyringStructs';
import type { SnapContext } from './lib/types/Context';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import { CustodianApiMap, CustodianType } from './lib/types/CustodianType';
import logger from './logger';
import { InternalMethod, originPermissions } from './permissions';
import { getClientStatus } from './snap-state-manager/snap-util';

/**
 * Verify if the caller can call the requested method.
 *
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
function hasPermission(origin: string, method: string): boolean {
  return originPermissions.get(origin)?.has(method) ?? false;
}

export const handleGetConnectedAccounts = async (
  request: ConnectionStatusRpcRequest,
  origin: string,
) => {
  assert(request, ConnectionStatusRpcRequest);

  const keyring = await getKeyring();
  return keyring.getConnectedAccounts(request, origin);
};

export const handleOnboarding = async (
  request: OnBoardingRpcRequest,
  origin: string,
) => {
  assert(request, OnBoardingRpcRequest);

  const CustodianApiClass = CustodianApiMap[request.custodianType];
  const keyring = await getKeyring();

  if (!Object.values(CustodianType).includes(request.custodianType)) {
    throw new Error(`Custodian type ${request.custodianType} not supported`);
  }

  const custodianApi = new CustodianApiClass(
    {
      refreshToken: request.token,
      refreshTokenUrl: request.refreshTokenUrl,
    },
    request.custodianApiUrl,
    1000,
  );

  let accounts = await custodianApi.getEthereumAccounts();

  // Filter out accounts that already exist in the keyring
  const existingAccounts = await keyring.listAccounts();

  for (const existingAccount of existingAccounts) {
    accounts = accounts.filter(
      (account) => account.address !== existingAccount.address,
    );
  }

  let result: OnboardingAccount[];

  try {
    result = await renderOnboarding({
      selectedAccounts: [],
      request,
      accounts,
      activity: 'onboarding',
    });
  } catch (error) {
    logger.error('Error choosing account', error);
    throw error;
  }

  if (result === null) {
    // No accounts selected, show error dialog
    return [];
  }

  const accountsToAdd: CreateAccountOptions[] = result.map((account) => ({
    address: account.address,
    name: account.name,
    details: { ...request },
    origin,
  }));

  const successfullyAddedAccounts: CreateAccountOptions[] = [];
  const failedAccounts: { account: CreateAccountOptions; error: Error }[] = [];

  for (const account of accountsToAdd) {
    try {
      await keyring.createAccount(account);
      successfullyAddedAccounts.push(account);
    } catch (error) {
      logger.error('Error creating account', error);
      failedAccounts.push({
        account,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  // If any accounts failed to add, show an error message
  if (failedAccounts.length > 0) {
    const errorMessage = failedAccounts
      .map(
        ({ account, error }) =>
          `Failed to add account ${account.address}: ${error.message}`,
      )
      .join('\n');

    await renderErrorMessage(errorMessage);
  }

  return successfullyAddedAccounts;
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns A promise that resolves to the result of the RPC request.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}: {
  origin: string;
  request: JsonRpcRequest;
}): Promise<
  | void
  | CreateAccountOptions[]
  | CustodialSnapRequest<SignedMessageRequest | TransactionRequest>
  | CustodialKeyringAccount[]
> => {
  logger.debug(
    `RPC request (origin="${origin}"): method="${request.method}"`,
    JSON.stringify(request, undefined, 2),
  );

  // Check if origin is allowed to call method.
  if (!hasPermission(origin, request.method)) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new UnauthorizedError(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }
  // `@audit-info` try-catch wrap and throw SnapError (https://docs.metamask.io/snaps/how-to/communicate-errors/#import-and-throw-errors) instead of internal exception.
  // Handle custom methods.
  switch (request.method) {
    case InternalMethod.Onboard: {
      assert(request.params, OnBoardingRpcRequest);
      return await handleOnboarding(request.params, origin);
    }

    // Returns only accounts, not connection details
    // implementation restricts accounts to the origin that imported them
    case InternalMethod.GetConnectedAccounts: {
      assert(request.params, ConnectionStatusRpcRequest);
      return await handleGetConnectedAccounts(request.params, origin);
    }

    case InternalMethod.ClearAllRequests: {
      if (config.dev) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const requestManager = await getRequestManager();
        return await requestManager.clearAllRequests();
      }
      throw new MethodNotFoundError(request.method);
    }

    case InternalMethod.GetMutableTransactionParameters: {
      assert(request.params, MutableTransactionSearchParameters);
      const requestManager = await getRequestManager();
      const result = await requestManager.getMutableTransactionParameters(
        request.params,
      );
      if (!result) {
        throw new Error('Request not found');
      }
      return result;
    }

    default: {
      throw new MethodNotFoundError(request.method);
    }
  }
};

export const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}: {
  origin: string;
  request: JsonRpcRequest;
}) => {
  logger.debug(
    `Keyring request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  // assert(request.params, KeyringRequestStruct);

  // Check if origin is allowed to call method.
  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  const keyring = await getKeyring();
  return handleKeyringRequest(keyring, request);
};

// Improved polling function
const pollRequests = async (): Promise<void> => {
  logger.info('Polling requests');
  try {
    await (await getRequestManager()).poll();
  } catch (error) {
    logger.error('Error polling requests', error);
    throw error;
  }
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  // Check if the client is locked
  // If it is, return so as not to try and access the encrypted storage which would cause the user to have to enter their password

  // TODO: In the future, we can have some unencrypted storage that is used to store whether the snap was ever used or not
  // or even a list of all the accounts and pending requests and then we can optionally unlock to continue polliog
  // But for now we just keep the client locked with the assumption that the user will unlock it when they want to complete the request

  const clientStatus = await getClientStatus();
  if (clientStatus.locked) {
    return;
  }

  switch (
    request.method // @audit-info this is execute every minute * * * * *  acc. to manifest
  ) {
    case 'execute': {
      const startTime = Date.now();
      const timeoutDuration = 60000; // 1 minute in milliseconds //@audit will this work with mm snap scheduling?

      // Run pollTransactions 6 times with 10-second intervals
      for (let i = 0; i < 6; i++) {
        // Check if we've exceeded the timeout
        if (Date.now() - startTime >= timeoutDuration) {
          return;
        }

        await pollRequests(); // @audit - what if there is nothing to poll?
        // If this isn't the last iteration, wait 10 seconds
        if (i < 5) {
          await new Promise((resolve) => setTimeout(resolve, 10000)); // @audit-info sleep(10sec)
        }
      }
      return;
    }

    default:
      throw new Error('Method not found.');
  }
};

export const onUserInput: OnUserInputHandler = async ({
  id,
  event,
  context,
}: {
  id: string;
  event: UserInputEvent;
  context: Record<string, Json> | null;
}) => {
  /**
   * Using the name of the component, route it to the correct handler
   */
  if (!event.name) {
    return;
  }

  const uiEventHandlers: Record<string, (...args: any) => Promise<void>> = {
    ...onboardingEvents,
    ...homePageEvents,
  };

  const prefixEventHandlers: Record<string, (...args: any) => Promise<void>> = {
    ...homePagePrefixEvents,
  };

  const handler =
    uiEventHandlers[event.name] ??
    prefixEventHandlers[
      Object.keys(prefixEventHandlers).find((key) =>
        event.name?.startsWith(key),
      ) ?? ''
    ];

  if (!handler) {
    return;
  }

  const keyring = await getKeyring();

  const snapContext: SnapContext = {
    keyring,
  };

  await handler({ id, event, context, snapContext });
};

export const onHomePage: OnHomePageHandler = async () => {
  const keyring = await getKeyring();
  const context = await getHomePageContext({ keyring });
  return { id: await renderHomePage(context) };
};

export type InstitutionalSnapTransactionRequest =
  CustodialSnapRequest<TransactionRequest>;
