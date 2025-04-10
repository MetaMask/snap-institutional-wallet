import type { ButtonClickEvent } from '@metamask/snaps-sdk/dist/types/handlers/user-input.cjs';

import { handleOnboarding } from '../..';
import { AddToken } from './components/AddToken';
import { CustodianList } from './components/CustodianList';
import { RemoveCustodianToken } from './components/RemoveCustodianToken';
import type { HomePageContext } from './context';
import { HomePageNames, HomePagePrefixes } from './types';
import type { CustodianMetadata } from '../../lib/custodian-types/custodianMetadata';
import { custodianMetadata } from '../../lib/custodian-types/custodianMetadata';
import {
  getInterfaceState,
  updateInterface,
} from '../../lib/helpers/interface';
import type { OnBoardingRpcRequest } from '../../lib/structs/CustodialKeyringStructs';
import type { SnapContext } from '../../lib/types/Context';
import logger from '../../logger';
import { renderErrorMessage } from '../error-message/render';
/**
 * Handles the select custodian button click event.
 * @param options - The options for the event.
 * @param options.id - The id of the interface.
 * @param options.event - The event.
 * @param options.context - The context for the homepage.
 */
export async function onSelectCustodianClick({
  id,
  event,
  context,
}: {
  id: string;
  event: ButtonClickEvent;
  context: HomePageContext;
}) {
  await updateInterface(
    id,
    <AddToken
      custodianName={
        event.name?.replace(HomePagePrefixes.SelectCustodian, '') ?? ''
      }
    />,
    context,
  );
}

/**
 * Handles the cancel token button click event.
 * @param options - The options for the event.
 * @param options.id - The id of the interface.
 * @param options.context - The context for the homepage.
 */
export async function onCancelTokenClick({
  id,
  context,
}: {
  id: string;
  context: HomePageContext;
}) {
  await updateInterface(
    id,
    <CustodianList accounts={context.accounts} />,
    context,
  );
}

/**
 * Handles the remove custodian token button click event.
 * @param options - The options for the event.
 * @param options.id - The id of the interface.
 * @param options.context - The context for the homepage.
 */
export async function onRemoveCustodianTokenClick({
  id,
  context,
}: {
  id: string;
  context: HomePageContext;
}) {
  await updateInterface(
    id,
    <RemoveCustodianToken accounts={context.accounts} />,
    context,
  );
}

/**
 * Handles the remove token button click event.
 * @param options - The options for the event.
 * @param options.id - The id of the interface.
 * @param options.context - The context for the homepage.
 * @param options.snapContext - The snap context.
 */
export async function onRemoveTokenClick({
  id,
  context,
  snapContext,
}: {
  id: string;
  context: HomePageContext;
  snapContext: SnapContext;
}) {
  for (const accountId of context.accounts?.map((account) => account.id) ??
    []) {
    try {
      await snapContext.keyring?.deleteAccount(accountId);
    } catch (error) {
      logger.error('Error deleting account', error);
    }
  }
  await updateInterface(
    id,
    <CustodianList accounts={context.accounts} />,
    context,
  );
}

/**
 * Handles the connect token button click event.
 * @param options - The options for the event.
 * @param options.id - The id of the interface.
 * @param options.event - The event.
 * @param options.context - The context for the homepage.
 */
export async function onConnectTokenClick({
  id,
  event,
  context,
}: {
  id: string;
  event: ButtonClickEvent;
  context: HomePageContext;
}) {
  const custodianName =
    event.name?.replace(HomePagePrefixes.ConnectToken, '') ?? '';
  const selectedCustodian = custodianMetadata.find(
    (custodian) => custodian.name === custodianName,
  ) as CustodianMetadata;

  if (!selectedCustodian) {
    throw new Error('Custodian not found');
  }

  const state = await getInterfaceState(id);

  try {
    const { apiUrl, token } = state.addTokenForm as {
      apiUrl: string;
      token: string;
    };

    let custodianApiUrl = apiUrl;
    if (!custodianApiUrl.length) {
      custodianApiUrl = selectedCustodian?.apiBaseUrl ?? '';
    }

    if (!token?.length) {
      throw new Error('Token is required');
    }

    const onboardingRequest: OnBoardingRpcRequest = {
      custodianType: selectedCustodian.apiVersion,
      custodianEnvironment: selectedCustodian.name ?? '',
      custodianApiUrl,
      custodianDisplayName: selectedCustodian.displayName ?? '',
      token,
      refreshTokenUrl: selectedCustodian.refreshTokenUrl ?? '',
    };

    await handleOnboarding(onboardingRequest, 'metamask');
  } catch (error: unknown) {
    logger.error('Error onboarding', error);
    if (error instanceof Error) {
      await updateInterface(
        id,
        <AddToken custodianName={custodianName} error={error.message} />,
        context,
      );
    } else {
      await renderErrorMessage('An unknown error occurred');
    }
  }
}

export const eventHandles = {
  [HomePageNames.RemoveCustodianToken]: onRemoveCustodianTokenClick,
  [HomePageNames.CancelRemoveToken]: onCancelTokenClick,
  [HomePageNames.RemoveToken]: onRemoveTokenClick,
  [HomePageNames.CancelToken]: onCancelTokenClick,
};

export const prefixEventHandles = {
  [HomePagePrefixes.SelectCustodian]: onSelectCustodianClick,
  [HomePagePrefixes.ConnectToken]: onConnectTokenClick,
};
