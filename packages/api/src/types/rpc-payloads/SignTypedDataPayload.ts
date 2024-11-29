import { TypedData } from 'eip-712';

export type SignTypedDataPayload = [
  {
    address: string;
    data: TypedData;
    version: string;
  },
  {
    chainId: string;
    originUrl: string;
    note: string;
  },
];
