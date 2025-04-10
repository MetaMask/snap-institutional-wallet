import type { SnapContext } from '../../lib/types/Context';
import type { CustodialKeyringAccount } from '../../lib/types/CustodialKeyringAccount';

export type HomePageContext = {
  activity: string;
  accounts: CustodialKeyringAccount[];
  devMode: boolean;
};

/**
 * Gets the context for the homepage.
 * @param snapContext - The snap context.
 * @returns The homepage context.
 */
export async function getHomePageContext(snapContext: SnapContext) {
  return {
    activity: 'homepage',
    accounts: await snapContext.keyring.listAccounts(),
    devMode: await snapContext.stateManager.getDevMode(),
  };
}
