import { GenericMessage } from './components/GenericMessage';
import type { OnboardingContext } from './context';
import { OnboardingNames, FormPrefixes } from './types';
import {
  getInterfaceState,
  resolveInterface,
  updateInterface,
} from '../../lib/helpers/interface';

/**
 * Handles the confirm button click event.
 *
 * @param context - The onboarding context.
 * @param context.id - The interface ID.
 * @param context.context - The context.
 */
export async function onConfirmClick({
  id,
  context,
}: {
  id: string;
  context: OnboardingContext;
}) {
  const state = await getInterfaceState(id);

  const selectedAccounts = Object.keys(state)
    .filter((key) => state[key] === true)
    .map((account) => account.replace(FormPrefixes.addressSelector, ''))
    .map((address) =>
      context.accounts.filter((account) => account.address === address),
    )
    .flat()
    .map((account) => ({
      address: account.address,
      name: account.name,
    }));

  if (selectedAccounts.length === 0) {
    await updateInterface(
      id,
      <GenericMessage
        title="No accounts imported"
        message="No accounts were selected"
      />,
      context,
    );
  } else {
    await resolveInterface(id, selectedAccounts);
  }
}

/**
 * Handles the cancel button click event.
 *
 * @param context - The onboarding context.
 * @param context.id - The interface ID.
 */
export async function onCancelClick({ id }: { id: string }) {
  await resolveInterface(id, []);
}

export const eventHandlers = {
  [OnboardingNames.ConfirmButton]: onConfirmClick,
  [OnboardingNames.CancelButton]: onCancelClick,
};
