import {
  MethodNotSupportedError,
  handleKeyringRequest,
} from '@metamask/keyring-api';
import type {
  UserInputEvent,
  OnCronjobHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import type {
  Json,
  OnKeyringRequestHandler,
  OnRpcRequestHandler,
} from '@metamask/snaps-types';

import { CustodialKeyring } from './keyring';
import type { ITransactionDetails } from './lib/types';
import type { CustodialSnapContext } from './lib/types/Context';
import { CustodianApiMap, CustodianType } from './lib/types/CustodianType';
import type { ICustodianApi } from './lib/types/ICustodianApi';
import type { OnBoardingRpcRequest } from './lib/types/OnBoardingRpcRequest';
import logger from './logger';
import type { OnboardingAccount } from './onboarding';
import { chooseAccountDialog, onboardingInterfaceHandler } from './onboarding';
import { InternalMethod, originPermissions } from './permissions';
import { getState } from './stateManagement';

let keyring: CustodialKeyring;

/**
 * Return the keyring instance. If it doesn't exist, create it.
 */
async function getKeyring(): Promise<CustodialKeyring> {
  if (!keyring) {
    const state = await getState();
    if (!keyring) {
      keyring = new CustodialKeyring(state);
    }
  }
  return keyring;
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

const handleOnboarding = async (request: OnBoardingRpcRequest) => {
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
    result = await chooseAccountDialog({
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
      return await (await getKeyring()).clearAllRequests();
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

type PendingTransactionHandler = {
  requestId: string;
  address: string;
  transactionId: string;
  custodianApi: ICustodianApi;
};

/**
 * Handles a pending transaction.
 *
 * @param options - Pending transaction options.
 * @param options.requestId - Request ID.
 * @param options.address - Address.
 * @param options.transactionId - Transaction ID.
 * @param options.custodianApi - Custodian API.
 */
async function handlePendingTransaction({
  requestId,
  address,
  transactionId,
  custodianApi,
}: PendingTransactionHandler): Promise<void> {
  const signedTransaction = await custodianApi.getTransaction(
    address,
    transactionId,
  );

  if (!signedTransaction) {
    return; // Transaction not found
  }

  const { transactionStatus } = signedTransaction;

  if (transactionStatus.finished && !transactionStatus.success) {
    await keyring.rejectRequest(requestId);
  }

  const pendingTransaction = keyring
    .listPendingTransactions()
    .find((tx) => tx.custodianTransactionId === transactionId);

  if (!pendingTransaction) {
    console.error('pending transaction not found');
    throw new Error(`Pending transaction '${transactionId}' not found`);
  }

  if (
    signedTransaction.signedRawTransaction || // We broadcast this one\
    (transactionStatus.finished &&
      transactionStatus.success &&
      transactionStatus.submitted) // They broadcasted it
  ) {
    logger.info(`Transaction ${transactionId} is finished`);
    const newProperties: Partial<ITransactionDetails> = {};

    if (signedTransaction.signedRawTransaction) {
      newProperties.signedRawTransaction =
        signedTransaction.signedRawTransaction;
    }

    if (signedTransaction.transactionHash) {
      newProperties.transactionHash = signedTransaction.transactionHash;
    }

    const updatedRequestId = await keyring.updatePendingTransaction(
      pendingTransaction.custodianTransactionId,
      {
        ...pendingTransaction,
        ...newProperties,
      },
    );
    await keyring.approveRequest(updatedRequestId);
  }
}

// Improved polling function
const pollTransactions = async (): Promise<void> => {
  try {
    keyring = await getKeyring();
    const pendingRequests = await keyring.listRequests();
    const pendingMessages = keyring.listPendingSignMessages();
    const pendingTransactions = keyring.listPendingTransactions();

    const messagePromises = pendingMessages.map(async (message) => {
      if (
        !pendingRequests.find((request) => request.id === message.requestId)
      ) {
        await keyring.removePendingSignMessage(message.requestId);
        return;
      }
      const request = await keyring.getRequest(message.requestId);
      const { address } = await keyring.getAccount(request.account);
      const custodianApi = keyring.getCustodianApiForAddress(address);

      const signedMessage = await custodianApi.getSignedMessage(
        address,
        message.id as string,
      );

      if (signedMessage?.status?.finished) {
        if (signedMessage.status.success) {
          const requestId = await keyring.updatePendingSignature(
            signedMessage.id,
            signedMessage.signature as string,
          );
          await keyring.approveRequest(requestId);
        } else {
          await keyring.rejectRequest(message.requestId);
        }
      }
    });

    const transactionPromises = pendingTransactions.map(async (transaction) => {
      if (!pendingRequests.find((req) => req.id === transaction.requestId)) {
        await keyring.removePendingTransaction(transaction.requestId);
        return;
      }

      const request = await keyring.getRequest(transaction.requestId);

      // If the account doesnt exist, remove the transaction
      const { account } = request;
      const accountExists = await keyring.accountExists(account);
      if (!accountExists) {
        await keyring.removePendingTransaction(transaction.requestId);
        return;
      }

      const { address } = await keyring.getAccount(account);
      const custodianApi = keyring.getCustodianApiForAddress(address);

      await handlePendingTransaction({
        requestId: transaction.requestId,
        address,
        transactionId: transaction.custodianTransactionId,
        custodianApi,
      });
    });

    await Promise.all([...messagePromises, ...transactionPromises]);
  } catch (error) {
    logger.error('Error polling transactions:', (error as Error).message);
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

        await pollTransactions();
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
  try {
    const ourContext = context as unknown as CustodialSnapContext;

    logger.info(
      'onUserInput',
      id,
      JSON.stringify(event, undefined, 2),
      JSON.stringify(ourContext, undefined, 2),
    );

    if (ourContext?.activity === 'onboarding') {
      await onboardingInterfaceHandler({ event, context: ourContext });
    }
  } catch (error) {
    logger.error('onUserInput error', error);
    throw error;
  }
};
