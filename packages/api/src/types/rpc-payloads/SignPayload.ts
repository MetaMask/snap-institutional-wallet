export type SignPayload = [
  {
    address: string;
    message: string;
  },
  {
    chainId: string;
    originUrl: string;
    note: string;
  },
];
