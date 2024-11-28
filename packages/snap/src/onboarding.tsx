import type { UserInputEvent } from '@metamask/snaps-sdk';

import { AddressSelector } from './components/AddressSelector';
import { GenericMessage } from './components/GenericMessage';
import type { OnboardingContext } from './lib/types/Context';

export type OnboardingAccount = { address: string; name: string };

export const FormConstants = {
  confirm: 'confirm',
  cancel: 'cancel',
};

export const FormPrefixes = {
  addressSelector: 'onboarding-address-selector-',
};

const onboardingState: {
  selectedAccounts: OnboardingAccount[] | null;
  interfaceId: string | null;
} = {
  selectedAccounts: [],
  interfaceId: null,
};

const setInterfaceId = (interfaceId: string) => {
  console.log('Setting interface ID', interfaceId);
  onboardingState.interfaceId = interfaceId;
};

const getInterfaceState = async () => {
  const state = await snap.request({
    method: 'snap_getInterfaceState',
    params: {
      id: onboardingState.interfaceId as string,
    },
  });

  return state;
};

const resolveInterface = async (value: OnboardingAccount[]) => {
  await snap.request({
    method: 'snap_resolveInterface',
    params: {
      id: onboardingState.interfaceId as string,
      value,
    },
  });
};

export const chooseAccountDialog = async (
  context: OnboardingContext,
): Promise<OnboardingAccount[]> => {
  const accounts: OnboardingAccount[] = context.accounts.map((account) => ({
    address: account.address,
    name: account.name,
  }));

  const interfaceId = await snap.request({
    method: 'snap_createInterface',
    params: {
      context,
      ui: <AddressSelector accounts={accounts} />,
    },
  });

  setInterfaceId(interfaceId);

  const result = (await snap.request({
    method: 'snap_dialog',
    params: {
      id: interfaceId,
    },
  })) as OnboardingAccount[];

  return result;
};

export const onboardingInterfaceHandler = async ({
  event,
  context,
}: {
  event: UserInputEvent;
  context: OnboardingContext;
}): Promise<void | null> => {
  try {
    if (
      event.type === 'ButtonClickEvent' &&
      event.name === FormConstants.confirm
    ) {
      const state = await getInterfaceState();

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
        return await snap.request({
          method: 'snap_updateInterface',
          params: {
            id: onboardingState.interfaceId as string,
            ui: (
              <GenericMessage
                title="No accounts imported"
                message="No accounts were selected"
              />
            ),
          },
        });
      }

      return await resolveInterface(selectedAccounts);
    } else if (
      event.type === 'ButtonClickEvent' &&
      event.name === FormConstants.cancel
    ) {
      return await resolveInterface([]);
    }
  } catch (error) {
    console.error('Error in interface handler', error);
  }

  return null;
};
