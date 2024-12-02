import { CustodianList } from './components/CustodianList';
import type { HomePageContext } from './context';
import { createInterface } from '../../lib/helpers/interface';

/**
 * Renders the homepage interface.
 * @param context - The context for the homepage.
 * @returns The interface id.
 */
export async function renderHomePage(context: HomePageContext) {
  return await createInterface(
    <CustodianList accounts={context.accounts} />,
    context,
  );
}
