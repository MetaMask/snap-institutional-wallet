import { EncryptedStateManager } from './encryptedStateManagement';
import { CustodialKeyring } from './keyring';
import type { CustodialSnapRequest } from './lib/structs/CustodialKeyringStructs';
import { RequestManager } from './requestsManager';
import { UnencryptedStateManager } from './unencryptedStateManagement';

let keyring: CustodialKeyring;
let requestManager: RequestManager;

const encryptedStateManager = new EncryptedStateManager();
const unencryptedStateManager = new UnencryptedStateManager();
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
 * Returns the encrypted state manager instance.
 */
export async function getEncryptedStateManager(): Promise<EncryptedStateManager> {
  return encryptedStateManager;
}

/**
 * Returns the unencrypted state manager instance.
 */
export async function getUnencryptedStateManager(): Promise<UnencryptedStateManager> {
  return unencryptedStateManager;
}

/**
 * Return the keyring instance. If it doesn't exist, create it.
 */
export async function getKeyring(): Promise<CustodialKeyring> {
  if (!keyring) {
    keyring = new CustodialKeyring(
      encryptedStateManager,
      unencryptedStateManager,
      requestManagerFacade,
    );
  }
  return keyring;
}

/**
 * Return the request manager instance. If it doesn't exist, create it.
 */
export async function getRequestManager(): Promise<RequestManager> {
  if (!requestManager) {
    requestManager = new RequestManager(encryptedStateManager, keyringFacade);
  }
  return requestManager;
}
