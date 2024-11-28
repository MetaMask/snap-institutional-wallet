import type { ComponentOrElement, UserInputEvent } from '@metamask/snaps-sdk';

import { handleOnboarding } from '.';
import { AddToken } from './components/AddToken';
import { HomePage } from './components/HomePage';
import { RemoveCustodianToken } from './components/RemoveCustodianToken';
import type { CustodialKeyring } from './keyring';
import { custodianMetadata } from './lib/custodian-types/custodianMetadata';
import type { HomePageContext } from './lib/types/Context';
import type { CustodianType } from './lib/types/CustodianType';
import type { OnBoardingRpcRequest } from './lib/types/OnBoardingRpcRequest';
import logger from './logger';

const homePageState: {
  interfaceId: string | null;
  keyring: CustodialKeyring | null;
} = {
  interfaceId: null,
  keyring: null,
};

export const setInterfaceId = (interfaceId: string) => {
  homePageState.interfaceId = interfaceId;
};

export const addAcountPage = async ({
  context,
  keyring,
}: {
  context: HomePageContext;
  keyring: CustodialKeyring;
}) => {
  const interfaceId = await snap.request({
    method: 'snap_createInterface',
    params: {
      context,
      ui: <HomePage accounts={await keyring.listAccounts()} />,
    },
  });

  homePageState.keyring = keyring;
  homePageState.interfaceId = interfaceId;

  return interfaceId;
};

export const getInterfaceState = async () => {
  const state = await snap.request({
    method: 'snap_getInterfaceState',
    params: {
      id: homePageState.interfaceId as string,
    },
  });

  return state;
};

export const updateInterface = async (ui: ComponentOrElement) => {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id: homePageState.interfaceId as string,
      ui,
    },
  });
};

export const resolveInterface = async (value: any) => {
  await snap.request({
    method: 'snap_resolveInterface',
    params: {
      id: homePageState.interfaceId as string,
      value,
    },
  });
};

const removeAccounts = async (accountIds: string[]) => {
  for (const accountId of accountIds) {
    try {
      await homePageState.keyring?.deleteAccount(accountId);
    } catch (error) {
      logger.error('Error deleting account', error);
    }
  }
};

export const homepageInterfaceHandler = async ({
  event,
}: {
  event: UserInputEvent;
}) => {
  try {
    const accounts = await homePageState.keyring?.listAccounts();

    if (
      event.type === 'ButtonClickEvent' &&
      event.name?.startsWith('select-')
    ) {
      return await updateInterface(
        <AddToken custodianName={event.name.replace('select-', '')} />,
      );
    }

    if (
      event.type === 'ButtonClickEvent' &&
      (event.name === 'cancel-token' || event.name === 'cancel-remove-token')
    ) {
      return await updateInterface(<HomePage accounts={accounts ?? []} />);
    }

    if (
      event.type === 'ButtonClickEvent' &&
      event.name === 'remove-custodian-token'
    ) {
      return await updateInterface(
        <RemoveCustodianToken accounts={accounts ?? []} />,
      );
    }

    if (event.type === 'ButtonClickEvent' && event.name === 'remove-token') {
      await removeAccounts(accounts?.map((account) => account.id) ?? []);
      return await updateInterface(<HomePage accounts={accounts ?? []} />);
    }

    if (
      event.type === 'ButtonClickEvent' &&
      event.name?.startsWith('connect-token')
    ) {
      const custodianName = event.name.replace('connect-token-', '');
      const selectedCustodian = custodianMetadata.find(
        (custodian) => custodian.name === custodianName,
      );
      const state = await snap.request({
        method: 'snap_getInterfaceState',
        params: {
          id: homePageState.interfaceId as string,
        },
      });

      const { apiUrl, token } = state.addTokenForm as any;
      const onboardingRequest: OnBoardingRpcRequest = {
        custodianType: `ECA${
          selectedCustodian?.apiVersion.toString() ?? ''
        }` as CustodianType,
        custodianEnvironment: selectedCustodian?.name ?? '',
        custodianApiUrl: selectedCustodian?.apiBaseUrl ?? '',
        custodianDisplayName: selectedCustodian?.displayName ?? '',
        apiUrl: apiUrl as string,
        token: token as string,
        refreshTokenUrl: selectedCustodian?.refreshTokenUrl ?? '',
      };
      return await handleOnboarding(onboardingRequest);
    }
  } catch (error) {
    console.error('Error in interface handler', error);
  }
  return true;
};
