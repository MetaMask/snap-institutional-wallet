import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

describe('onRpcRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const snap = await installSnap();

    const response = await snap.request({
      method: 'foo',
    });

    expect((response.response as any).error).toMatchObject({
      code: -32603,
      message: "Origin 'https://metamask.io' is not allowed to call 'foo'",
      stack: expect.any(String),
    });
  });
});

describe('onKeyringRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const snap = await installSnap();

    const response = await snap.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:@metamask/solana-wallet-snap',
        request: {
          method: 'foo',
        },
      },
    });

    expect((response.response as any).error).toMatchObject({
      code: -32603,
      message:
        "Origin 'https://metamask.io' is not allowed to call 'wallet_invokeSnap'",
      stack: expect.any(String),
    });
  });
});
