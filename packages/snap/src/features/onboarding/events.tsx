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
 */
export async function onConfirmClick(context: OnboardingContext) {
  const state = await getInterfaceState(context.interfaceId as string);

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
      context.interfaceId as string,
      <GenericMessage
        title="No accounts imported"
        message="No accounts were selected"
      />,
      context,
    );
  } else {
    await resolveInterface(context.interfaceId as string, selectedAccounts);
  }
}

/**
 * Handles the cancel button click event.
 *
 * @param context - The onboarding context.
 */
export async function onCancelClick(context: OnboardingContext) {
  await resolveInterface(context.interfaceId as string, []);
}

export const eventHandlers = {
  [OnboardingNames.ConfirmButton]: onConfirmClick,
  [OnboardingNames.CancelButton]: onCancelClick,
};
