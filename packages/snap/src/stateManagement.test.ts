import { EthAccountType, EthMethod } from '@metamask/keyring-api';

import type {
  CustodialSnapRequest,
  OnBoardingRpcRequest,
  PersonalSignMessageRequest,
} from './lib/structs/CustodialKeyringStructs';
import type { Wallet, SnapState } from './lib/types/CustodialKeyring';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import { CustodianType } from './lib/types/CustodianType';
import * as snapUtil from './snap-state-manager/snap-util';
import { KeyringStateManager } from './stateManagement';

describe('KeyringStateManager', () => {
  const createMockStateManager = () => {
    const getDataSpy = jest.spyOn(snapUtil, 'getStateData');
    const setDataSpy = jest.spyOn(snapUtil, 'setStateData');
    return {
      instance: new KeyringStateManager(),
      getDataSpy,
      setDataSpy,
    };
  };

  const createMockAccount = (id: string): CustodialKeyringAccount => ({
    id,
    address: `0x${id}`,
    options: {
      custodian: {
        displayName: 'Test Custodian',
        deferPublication: false,
        importOrigin: 'test-origin',
      },
    },
    methods: [EthMethod.SignTransaction, EthMethod.PersonalSign],
    type: EthAccountType.Eoa,
  });

  const createMockWallet = (id: string): Wallet => ({
    account: createMockAccount(id),
    details: {
      custodianType: CustodianType.ECA1,
      custodianEnvironment: 'test',
      custodianApiUrl: 'https://api.test.com',
      custodianDisplayName: 'Test Custodian',
      token: 'test-token',
      refreshTokenUrl: 'https://api.test.com/refresh',
    },
  });

  const createInitState = (count = 1): SnapState => {
    const wallets: Record<string, Wallet> = {};
    const walletIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const id = i.toString();
      wallets[id] = createMockWallet(id);
      walletIds.push(id);
    }

    return {
      wallets,
      walletIds,
      requests: {},
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('initializes empty state if state is null', async () => {
      const { instance, getDataSpy } = createMockStateManager();
      getDataSpy.mockResolvedValue(null);

      const accounts = await instance.listAccounts();

      expect(getDataSpy).toHaveBeenCalledTimes(1);
      expect(accounts).toStrictEqual([]);
    });
  });

  describe('listAccounts', () => {
    it('returns all accounts', async () => {
      const { instance, getDataSpy } = createMockStateManager();
      const state = createInitState(3);
      getDataSpy.mockResolvedValue(state);

      const accounts = await instance.listAccounts();

      expect(accounts).toHaveLength(3);
      expect(accounts).toStrictEqual(
        Object.values(state.wallets).map((wallet) => wallet.account),
      );
    });
  });

  describe('listWallets', () => {
    it('returns all wallets', async () => {
      const { instance, getDataSpy } = createMockStateManager();
      const state = createInitState(3);
      getDataSpy.mockResolvedValue(state);

      const wallets = await instance.listWallets();

      expect(wallets).toHaveLength(3);
      expect(wallets).toStrictEqual(Object.values(state.wallets));
    });
  });

  describe('addWallet', () => {
    it('adds a new wallet', async () => {
      const { instance, getDataSpy, setDataSpy } = createMockStateManager();
      const state = createInitState(0);
      getDataSpy.mockResolvedValue(state);

      const wallet = createMockWallet('1');
      await instance.addWallet(wallet);

      expect(state.wallets['1']).toStrictEqual(wallet);
      expect(state.walletIds).toContain('1');
      expect(setDataSpy).toHaveBeenCalled();
    });

    it('throws if wallet with same id exists', async () => {
      const { instance, getDataSpy } = createMockStateManager();
      const state = createInitState(1);
      getDataSpy.mockResolvedValue(state);

      const wallet = createMockWallet('0');
      await expect(instance.addWallet(wallet)).rejects.toThrow(
        'Account address 0x0 already exists',
      );
    });
  });

  describe('updateWalletDetails', () => {
    it('updates wallet details', async () => {
      const { instance, getDataSpy, setDataSpy } = createMockStateManager();
      const state = createInitState(1);
      getDataSpy.mockResolvedValue(state);

      const details: OnBoardingRpcRequest = {
        custodianType: CustodianType.ECA1,
        custodianEnvironment: 'test',
        custodianApiUrl: 'https://api.test.com',
        custodianDisplayName: 'Test Custodian',
        token: 'new-token',
        refreshTokenUrl: 'https://api.test.com/refresh',
      };

      await instance.updateWalletDetails('0', details);

      const wallet = await instance.getWallet('0');
      expect(wallet?.details).toStrictEqual(details);
      expect(setDataSpy).toHaveBeenCalled();
    });

    it('throws if wallet does not exist', async () => {
      const { instance, getDataSpy } = createMockStateManager();
      const state = createInitState(0);
      getDataSpy.mockResolvedValue(state);

      await expect(
        instance.updateWalletDetails('0', {
          custodianType: CustodianType.ECA1,
          custodianEnvironment: 'test',
          custodianApiUrl: 'https://api.test.com',
          custodianDisplayName: 'Test Custodian',
          token: 'new-token',
          refreshTokenUrl: 'https://api.test.com/refresh',
        }),
      ).rejects.toThrow('Wallet for account 0 does not exist');
    });
  });

  describe('getWalletByAddress', () => {
    it('returns wallet with matching address', async () => {
      const { instance, getDataSpy } = createMockStateManager();
      const state = createInitState(3);
      getDataSpy.mockResolvedValue(state);

      const wallet = await instance.getWalletByAddress('0x0');

      expect(wallet).toStrictEqual(state.wallets['0']);
    });

    it('returns null if no wallet matches address', async () => {
      const { instance, getDataSpy } = createMockStateManager();
      const state = createInitState(3);
      getDataSpy.mockResolvedValue(state);

      const wallet = await instance.getWalletByAddress(
        '0x94b21bdbe1a2d4b09d048ab7d865a7d352da1a51',
      );

      expect(wallet).toBeNull();
    });
  });

  describe('Request Management', () => {
    const createMockRequest = (
      id: string,
    ): CustodialSnapRequest<PersonalSignMessageRequest> => ({
      keyringRequest: {
        id,
        scope: '',
        account: '76389c2b-2813-4913-9568-caad36b1c2b2',
        request: {
          method: 'personal_sign',
          params: [
            '0x48656c6c6f2c20776f726c6421',
            '0x94b21bdbe1a2d4b09d048ab7d865a7d352da1a51',
          ],
        },
      },
      type: 'message',
      subType: 'personalSign',
      fulfilled: false,
      rejected: false,
      message: {
        id: '67b32762-afeb-40de-bea5-6d01b6064bfe',
        status: {
          finished: false,
          submitted: false,
          signed: false,
          success: false,
          displayText: 'Created',
          reason: '',
        },
        signature: null,
        from: '0x94b21bdbe1a2d4b09d048ab7d865a7d352da1a51',
      },
      signature: null,
      lastUpdated: 1738076358740,
    });

    describe('listRequests', () => {
      it('returns all requests', async () => {
        const { instance, getDataSpy } = createMockStateManager();
        const state = createInitState(1);
        const request = createMockRequest('req1');
        state.requests.req1 = request;
        getDataSpy.mockResolvedValue(state);

        const requests = await instance.listRequests();

        expect(requests).toStrictEqual([request]);
      });
    });

    describe('upsertRequest', () => {
      it('adds new request', async () => {
        const { instance, getDataSpy, setDataSpy } = createMockStateManager();
        const state = createInitState(1);
        getDataSpy.mockResolvedValue(state);

        const request = createMockRequest('req1');
        await instance.upsertRequest(request);

        expect(state.requests.req1).toStrictEqual(request);
        expect(setDataSpy).toHaveBeenCalled();
      });

      it('updates existing request', async () => {
        const { instance, getDataSpy, setDataSpy } = createMockStateManager();
        const state = createInitState(1);
        const originalRequest = createMockRequest('req1');
        state.requests.req1 = originalRequest;
        getDataSpy.mockResolvedValue(state);

        const updatedRequest = {
          ...originalRequest,
          origin: 'updated',
        };
        await instance.upsertRequest(updatedRequest);

        expect(state.requests.req1).toStrictEqual(updatedRequest);
        expect(setDataSpy).toHaveBeenCalled();
      });
    });

    describe('removeRequest', () => {
      it('removes existing request', async () => {
        const { instance, getDataSpy, setDataSpy } = createMockStateManager();
        const state = createInitState(1);
        state.requests.req1 = createMockRequest('req1');
        getDataSpy.mockResolvedValue(state);

        await instance.removeRequest('req1');

        expect(state.requests.req1).toBeUndefined();
        expect(setDataSpy).toHaveBeenCalled();
      });

      it('does nothing if request does not exist', async () => {
        const { instance, getDataSpy, setDataSpy } = createMockStateManager();
        const state = createInitState(1);
        getDataSpy.mockResolvedValue(state);

        await instance.removeRequest('nonexistent');

        expect(setDataSpy).toHaveBeenCalled();
      });
    });

    describe('clearAllRequests', () => {
      it('removes all requests', async () => {
        const { instance, getDataSpy, setDataSpy } = createMockStateManager();
        const state = createInitState(1);
        state.requests.req1 = createMockRequest('req1');
        state.requests.req2 = createMockRequest('req2');
        getDataSpy.mockResolvedValue(state);

        await instance.clearAllRequests();

        expect(state.requests).toStrictEqual({});
        expect(setDataSpy).toHaveBeenCalled();
      });
    });
  });
});
