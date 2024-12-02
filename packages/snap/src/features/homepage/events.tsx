import type { ButtonClickEvent } from '@metamask/snaps-sdk/dist/types/handlers/user-input.cjs';

import { handleOnboarding } from '../..';
import { AddToken } from './components/AddToken';
import { CustodianList } from './components/CustodianList';
import { RemoveCustodianToken } from './components/RemoveCustodianToken';
import type { HomePageContext } from './context';
import { HomePageNames, HomePagePrefixes } from './types';
import { custodianMetadata } from '../../lib/custodian-types/custodianMetadata';
import {
  getInterfaceState,
  updateInterface,
} from '../../lib/helpers/interface';
import type { SnapContext } from '../../lib/types/Context';
import type { CustodianType } from '../../lib/types/CustodianType';
import type { OnBoardingRpcRequest } from '../../lib/types/OnBoardingRpcRequest';
import logger from '../../logger';

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
 */
export async function onConnectTokenClick({
  id,
  event,
}: {
  id: string;
  event: ButtonClickEvent;
}) {
  const custodianName =
    event.name?.replace(HomePagePrefixes.ConnectToken, '') ?? '';
  const selectedCustodian = custodianMetadata.find(
    (custodian) => custodian.name === custodianName,
  );
  const state = await getInterfaceState(id);
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

  await handleOnboarding(onboardingRequest);
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