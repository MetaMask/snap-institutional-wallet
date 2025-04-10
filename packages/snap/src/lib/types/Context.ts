import type { CustodialKeyring } from '../../keyring';
import type { KeyringStateManager } from '../../stateManagement';

export type SnapContext = {
  keyring: CustodialKeyring;
  stateManager: KeyringStateManager;
};
