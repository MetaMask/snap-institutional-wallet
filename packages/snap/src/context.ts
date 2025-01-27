import { CustodialKeyring } from './keyring';
import type { CustodialSnapRequest } from './lib/structs/CustodialKeyringStructs';
import { RequestManager } from './requestsManager';
import { KeyringStateManager } from './stateManagement';

let keyring: CustodialKeyring;
let requestManager: RequestManager;

const stateManager = new KeyringStateManager();

// Allow the keyring to call certain methods on the request manager
const requestManagerFacade = {
  upsertRequest: async (request: CustodialSnapRequest<any>) => {
    requestManager = await getRequestManager();
    return requestManager.upsertRequest(request);
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
    return await keyring.getCustodianApiForAddress(address);
  },
  getAccount: async (accountId: string) => {
    keyring = await getKeyring();
    return keyring.getAccount(accountId);
  },
};

/**
 * Return the state manager instance. If it doesn't exist, create it.
 */
export async function getStateManager(): Promise<KeyringStateManager> {
  return stateManager;
}

/**
 * Return the keyring instance. If it doesn't exist, create it.
 */
export async function getKeyring(): Promise<CustodialKeyring> {
  if (!keyring) {
    keyring = new CustodialKeyring(stateManager, requestManagerFacade);
  }
  return keyring;
}

/**
 * Return the request manager instance. If it doesn't exist, create it.
 */
export async function getRequestManager(): Promise<RequestManager> {
  if (!requestManager) {
    requestManager = new RequestManager(stateManager, keyringFacade);
  }
  return requestManager;
}
