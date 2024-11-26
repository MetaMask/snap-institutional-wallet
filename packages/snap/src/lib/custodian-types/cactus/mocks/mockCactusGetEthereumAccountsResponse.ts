import type { ICactusEthereumAccount } from '../interfaces/ICactusEthereumAccount';

export const mockCactusGetEthereumAccountsResponse: ICactusEthereumAccount[] = [
  {
    name: '',
    address: '0x05CA0e55d90D9A29051514fD03646936b0348b7f',
    labels: null,
    balance: '244198520993990690',
    chainId: 42,
    custodianDetails: {
      domainId: 'bac5fd753f3c4264a12a2bcd2e4e597e',
      projectId: '02be19d0fb354c739843c5220d3fed1d',
      walletId: 'CHETH6767655631',
    },
  },
  {
    name: '测试',
    address: '0xB83599383546Dc1E1E598A2E3DBEe8CFeACEaf3f',
    labels: null,
    balance: '0',
    chainId: 42,
    custodianDetails: {
      domainId: 'bac5fd753f3c4264a12a2bcd2e4e597e',
      projectId: '02be19d0fb354c739843c5220d3fed1d',
      walletId: 'CHETH1164443428',
    },
  },
  {
    name: '',
    address: '0xE9A670d363686ecdB3A9fb1dfa0c4F55e492CACC',
    labels: ['test-label'],
    balance: '0',
    chainId: 42,
    custodianDetails: {
      domainId: 'bac5fd753f3c4264a12a2bcd2e4e597e',
      projectId: '02be19d0fb354c739843c5220d3fed1d',
      walletId: 'CHETH1277432223',
    },
  },
  {
    name: '',
    address: '0x413c30fB743A96A997Ab7C8295a5479e92057a71',
    labels: null,
    balance: '0',
    chainId: 42,
    custodianDetails: {
      domainId: 'bac5fd753f3c4264a12a2bcd2e4e597e',
      projectId: 'a0419e1874f247199bcc31391285d782',
      walletId: 'CHETH8580237864',
    },
  },
  {
    name: '',
    address: '0x4Fe2D50aBf7635Bb93bc0F3929ADeeA16733E49c',
    labels: null,
    balance: '0',
    chainId: 42,
    custodianDetails: {
      domainId: 'bac5fd753f3c4264a12a2bcd2e4e597e',
      projectId: 'a0419e1874f247199bcc31391285d782',
      walletId: 'CHETH8284372606',
    },
  },
];
