export type IBitgoEIP712Response = {
  data: {
    id: string;
    status: {
      finished: boolean;
      signed: boolean;
      success: boolean;
      displayText: string;
    };
    createdTime: string;
    wallet: string;
    enterprise: string;
    message: string;
    coin: string;
    signature: string;
  };
  _meta: { reqId: string };
};
