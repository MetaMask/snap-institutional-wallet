/* eslint-disable @typescript-eslint/no-throw-literal */
import { handleKeyringRequest } from '@metamask/keyring-snap-sdk';
import type { JsonRpcRequest } from '@metamask/keyring-utils';
import {
  type UserInputEvent,
  type OnCronjobHandler,
  type OnUserInputHandler,
  type OnHomePageHandler,
  type OnKeyringRequestHandler,
  type OnRpcRequestHandler,
  UnauthorizedError,
  MethodNotFoundError,
} from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';
import type { Json } from '@metamask/utils';

import { getKeyring, getRequestManager, getStateManager } from './context';
import { isDevMode, setDevMode } from './dev-mode';
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
import { REFRESH_TOKEN_CHANGE_EVENT } from './lib/custodian-types/constants';
import type {
  CreateAccountOptions,
  CustodialSnapRequest,
  TransactionRequest,
} from './lib/structs/CustodialKeyringStructs';
import {
  MutableTransactionSearchParameters,
  OnBoardingRpcRequest,
  ConnectionStatusRpcRequest,
} from './lib/structs/CustodialKeyringStructs';
import type { SnapContext } from './lib/types/Context';
import { CustodianApiMap, CustodianType } from './lib/types/CustodianType';
import type { IRefreshTokenChangeEvent } from './lib/types/IRefreshTokenChangeEvent';
import logger from './logger';
import { InternalMethod, hasPermission } from './permissions';
import { getClientStatus } from './snap-state-manager/snap-util';
import { getSleepState, setSleepState } from './util/sleep';

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

  // Set activated to true, so that we don't go back to sleep again
  const stateManager = await getStateManager();
  await stateManager.setActivated(true);

  // Now disable sleep, so that polling can resume
  await setSleepState(false);

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

  // In case the refresh token is non-interactively replaced during onboarding

  custodianApi.on(
    REFRESH_TOKEN_CHANGE_EVENT,
    (event: IRefreshTokenChangeEvent) => {
      // Update the request authentication details with the new refresh token
      request.token = event.newRefreshToken;
    },
  );

  // Already-imported accounts are deliberately left in the list: selecting one
  // refreshes its custodian credentials (see `CustodialKeyring.createAccount`).
  // They used to be filtered out here, but with a case-sensitive address
  // comparison, unlike the checksum-based lookup the keyring does -- so a
  // custodian returning differently-cased addresses got past the filter and
  // then failed with "address already in use".
  const accounts = await custodianApi.getEthereumAccounts();

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
}): Promise<Json> => {
  logger.debug(
    `RPC request (origin="${origin}"): method="${request.method}"`,
    JSON.stringify(request, undefined, 2),
  );

  // Check if origin is allowed to call method.
  if (!(await hasPermission(origin, request.method))) {
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
      // These payloads are structurally JSON, but their superstruct-derived
      // types use `optional()` (i.e. `| undefined`), which `Json` disallows.
      return (await handleOnboarding(
        request.params,
        origin,
      )) as unknown as Json;
    }

    // Returns only accounts, not connection details
    // implementation restricts accounts to the origin that imported them
    case InternalMethod.GetConnectedAccounts: {
      assert(request.params, ConnectionStatusRpcRequest);
      return (await handleGetConnectedAccounts(
        request.params,
        origin,
      )) as unknown as Json;
    }

    case InternalMethod.ClearAllRequests: {
      if (await isDevMode()) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const requestManager = await getRequestManager();
        await requestManager.clearAllRequests();
        return null;
      }
      throw new MethodNotFoundError(request.method);
    }

    case InternalMethod.GetIsSupported: {
      return true;
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
      return result as unknown as Json;
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
  if (!(await hasPermission(origin, request.method))) {
    // Must be a `SnapError` subclass. A plain `Error` thrown from a handler is
    // treated as an unhandled error by the execution environment and crashes
    // the snap, rather than being returned to the caller as a JSON-RPC error.
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new UnauthorizedError(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  const keyring = await getKeyring();
  // `handleKeyringRequest` resolves to `void` for notification-style methods,
  // but the `onKeyringRequest` handler must resolve to `Json`.
  return (await handleKeyringRequest(keyring, request)) ?? null;
};

// Improved polling function
const pollRequests = async (): Promise<void> => {
  try {
    await (await getRequestManager()).poll();
  } catch (error) {
    logger.error('Error polling requests', error);
    throw error;
  }
};

/**
 * Check if the client is locked or if the snap is not activated.
 *
 * @returns True if the client is locked or the snap is not activated, false otherwise.
 */
async function lockedOrInactive() {
  // First check if the client is locked
  // Because we need access to the encrypted state
  // to see the activated state

  const clientStatus = await getClientStatus();
  if (clientStatus.locked) {
    return true;
  }

  const stateManager = await getStateManager();

  // Now check if the snap is activated
  // i.e. has ever had an onboarding request
  const activated = await stateManager.getActivated();
  if (!activated) {
    return true;
  }

  return false;
}

// The basic idea is that we don't want to make unncessary calls to the client
// So we have two cron jobs:
// 'execute' does polling and does not check sleep state
// 'manageSleepState' checks if the client is locked or if the snap is activated and should maintain the sleep state

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  // This one runs every 15 seconds, but should do nothing if we are asleep
  // or if the client is locked
  if (request.method === 'execute') {
    // see if we are asleep, if so, do nothing
    // The `manageSleepState` cronjob will eventually wake us up if the snap is activated and the client is unlocked
    if (await getSleepState()) {
      return;
    }

    const shouldSleep = await lockedOrInactive();
    if (shouldSleep) {
      await setSleepState(true);
      return;
    }

    // Awake, activated, and unlocked. Poll!
    await pollRequests();

    // This one runs every minute, and maintains the sleep state
  } else if (request.method === 'manageSleepState') {
    const shouldSleep = await lockedOrInactive();
    if (shouldSleep) {
      await setSleepState(true);
    } else {
      await setSleepState(false);
    }
  } else {
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
  const stateManager = await getStateManager();
  const snapContext: SnapContext = {
    keyring,
    stateManager,
  };

  await handler({ id, event, context, snapContext });
};

export const onHomePage: OnHomePageHandler = async () => {
  const keyring = await getKeyring();
  const stateManager = await getStateManager();
  const context = await getHomePageContext({ keyring, stateManager });
  return { id: await renderHomePage(context) };
};

export const handleSetDevMode = async (devMode: boolean) => {
  await setDevMode(devMode);
};

export type InstitutionalSnapTransactionRequest =
  CustodialSnapRequest<TransactionRequest>;
