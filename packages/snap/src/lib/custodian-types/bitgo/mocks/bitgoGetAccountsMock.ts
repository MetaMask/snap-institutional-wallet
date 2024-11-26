import type { IBitgoGetEthereumAccountsResponse } from '../interfaces/IBitgoGetEthereumAccountsResponse';

export const bitgoGetAccountsMock: IBitgoGetEthereumAccountsResponse = {
  data: [
    {
      address: '0xeddb59689e4ec3931b8d42d615c0d4a7a3a208e7',
      balance: '5126000002175583738',
      chainId: 5,
      custodianDetails: {
        coin: 'gteth',
        id: '614a2a61df1332000686516a6dbee90a',
      },
      labels: [
        {
          key: 'Wallet Name',
          value: 'MMI Alpha test 1',
        },
        {
          key: 'Wallet Id',
          value: '614a2a61df1332000686516a6dbee90a',
        },
        {
          key: 'Enterprise Name',
          value: 'MMI Alpha',
        },
        {
          key: 'Enterpise Id',
          value: '614a226f3da19200071b3d6a0180e87e',
        },
      ],
    },
    {
      address: '0xb22505ee2aac7d52d4a218f5877cdbae3bbeec75',
      balance: '20118496397049045766',
      chainId: 5,
      custodianDetails: {
        coin: 'gteth',
        id: '614a2c0f773b190006689199fc523b8b',
      },
      labels: [
        {
          key: 'Wallet Name',
          value: 'MMI Alpha test 2',
        },
        {
          key: 'Wallet Id',
          value: '614a2c0f773b190006689199fc523b8b',
        },
        {
          key: 'Enterprise Name',
          value: 'MMI Alpha',
        },
        {
          key: 'Enterpise Id',
          value: '614a226f3da19200071b3d6a0180e87e',
        },
      ],
    },
  ],
};
