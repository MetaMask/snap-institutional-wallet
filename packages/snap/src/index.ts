import {
  MethodNotSupportedError,
  handleKeyringRequest,
} from '@metamask/keyring-api';
import type {
  UserInputEvent,
  OnCronjobHandler,
  OnUserInputHandler,
  OnHomePageHandler,
} from '@metamask/snaps-sdk';
import type {
  Json,
  OnKeyringRequestHandler,
  OnRpcRequestHandler,
} from '@metamask/snaps-types';

import { getHomePageContext } from './features/homepage/context';
import {
  eventHandles as homePageEvents,
  prefixEventHandles as homePagePrefixEvents,
} from './features/homepage/events';
import { renderHomePage } from './features/homepage/render';
import { eventHandlers as onboardingEvents } from './features/onboarding/events';
import { renderOnboarding } from './features/onboarding/render';
import type { OnboardingAccount } from './features/onboarding/types';
import { CustodialKeyring } from './keyring';
import type { SnapContext } from './lib/types/Context';
import type { CustodialSnapRequest } from './lib/types/CustodialKeyring';
import { CustodianApiMap, CustodianType } from './lib/types/CustodianType';
import type { OnBoardingRpcRequest } from './lib/types/OnBoardingRpcRequest';
import logger from './logger';
import { InternalMethod, originPermissions } from './permissions';
import { RequestManager } from './requestsManager';
import { getState } from './stateManagement';

let keyring: CustodialKeyring;
let requestManager: RequestManager;

// Allow the keyring to call certain methods on the request manager
const requestManagerFacade = {
  addPendingRequest: async (request: CustodialSnapRequest<any>) => {
    requestManager = await getRequestManager();
    return requestManager.addPendingRequest(request);
  },
  listRequests: async () => {
    requestManager = await getRequestManager();
    return requestManager.listRequests();
  },
};

// Allow the request manager to call certain methods on the keyring
const keyringFacade = {
  getCustodianApiForAddress: async (address: string) => {
    keyring = await getKeyring();
    return keyring.getCustodianApiForAddress(address);
  },
  getAccount: async (accountId: string) => {
    keyring = await getKeyring();
    return keyring.getAccount(accountId);
  },
};

/**
 * Return the keyring instance. If it doesn't exist, create it.
 */
async function getKeyring(): Promise<CustodialKeyring> {
  if (!keyring) {
    const state = await getState();
    if (!keyring) {
      keyring = new CustodialKeyring(state, requestManagerFacade);
    }
  }
  return keyring;
}

/**
 * Return the request manager instance. If it doesn't exist, create it.
 */
async function getRequestManager(): Promise<RequestManager> {
  if (!requestManager) {
    // eslint-disable-next-line require-atomic-updates
    requestManager = new RequestManager(await getState(), keyringFacade);
  }
  return requestManager;
}

/**
 * Verify if the caller can call the requested method.
 *
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
function hasPermission(origin: string, method: string): boolean {
  return originPermissions.get(origin)?.includes(method) ?? false;
}

export const handleOnboarding = async (request: OnBoardingRpcRequest) => {
  const CustodianApiClass = CustodianApiMap[request.custodianType];
  keyring = await getKeyring();

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

  const accountsToAdd = result.map((account) => ({
    address: account.address,
    name: account.name,
    details: { ...request },
  }));

  for (const account of accountsToAdd) {
    try {
      await keyring.createAccount(account);
    } catch (error) {
      logger.error('Error creating account', error);
    }
  }

  return accountsToAdd;
};

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.debug(
    `RPC request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  // Check if origin is allowed to call method.
  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  // Handle custom methods.
  switch (request.method) {
    case InternalMethod.Onboard: {
      return await handleOnboarding(request.params as OnBoardingRpcRequest);
    }

    case InternalMethod.ClearAllRequests: {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const requestManager = await getRequestManager();
      return await requestManager.clearAllRequests();
    }

    default: {
      throw new MethodNotSupportedError(request.method);
    }
  }
};

export const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}) => {
  logger.debug(
    `Keyring request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  // Check if origin is allowed to call method.
  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  // Handle keyring methods.
  return handleKeyringRequest(await getKeyring(), request);
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
  switch (request.method) {
    case 'execute': {
      const startTime = Date.now();
      const timeoutDuration = 60000; // 1 minute in milliseconds

      // Run pollTransactions 6 times with 10-second intervals
      for (let i = 0; i < 6; i++) {
        // Check if we've exceeded the timeout
        if (Date.now() - startTime >= timeoutDuration) {
          return;
        }

        await pollRequests();
        // If this isn't the last iteration, wait 10 seconds
        if (i < 5) {
          await new Promise((resolve) => setTimeout(resolve, 10000));
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

  const snapContext: SnapContext = {
    keyring,
  };

  await handler({ id, event, context, snapContext });
};

export const onHomePage: OnHomePageHandler = async () => {
  keyring = await getKeyring();
  const context = await getHomePageContext({ keyring });
  return { id: await renderHomePage(context) };
};
