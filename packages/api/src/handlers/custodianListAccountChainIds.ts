import accounts from '../custodian/accounts';
import type { ListAccountChainIdsPayload } from '../types/rpc-payloads/ListAccountChainIdsPayload';
import type { ListAccountChainIdsResponse } from '../types/rpc-responses/ListAccountChainIdsResponse';

export const custodianListAccountChainIds = async (
  address: ListAccountChainIdsPayload[0],
): Promise<ListAccountChainIdsResponse> => {
  console.log('custodianListAccountChainIds', address);
  const keyringAccounts = await accounts.getAccounts();

  const account = keyringAccounts.find(
    (account) => account.address === address,
  );

  return account?.supportedChains || [];
};
