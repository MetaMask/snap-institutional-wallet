import { ListAccountsResponse } from '../types/rpc-responses/ListAccountsResponse';
import accounts from '../custodian/accounts';

export const custodianListAccounts =
  async (): Promise<ListAccountsResponse> => {
    const keyringAccounts = await accounts.getAccounts();
    return keyringAccounts.map((account) => {
      return {
        name: account.name,
        address: account.address,
        tags: [
          {
            name: 'Account Name',
            value: account.name,
          },
        ],
        metadata: {
          active: true,
          deleted: false,
          isContract: false,
        },
      };
    });
  };
