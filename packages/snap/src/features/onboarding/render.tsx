import { AddressSelector } from './components/AddressSelector';
import type { OnboardingContext } from './context';
import type { OnboardingAccount } from './types';
import { createInterface, showDialog } from '../../lib/helpers/interface';

/**
 * Renders the onboarding interface.
 *
 * @param context - The onboarding context.
 * @returns The result of the dialog.
 */
export async function renderOnboarding(context: OnboardingContext) {
  const accounts: OnboardingAccount[] = context.accounts.map((account) => ({
    address: account.address,
    name: account.name,
  }));

  const id = await createInterface(
    <AddressSelector accounts={accounts} />,
    context,
  );

  const result = await showDialog(id);

  return result as OnboardingAccount[];
}
