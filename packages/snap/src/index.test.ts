import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

describe('onRpcRequest', () => {
  it('throws an error if the requested method is not allowed from a specific origin', async () => {
    const snap = await installSnap();

    const response = await snap.request({
      origin: 'https://www.disney.com',
      method: 'foo',
    });

    expect((response.response as any).error).toMatchObject({
      code: -32603,
      message: "Origin 'https://www.disney.com' is not allowed to call 'foo'",
      stack: expect.any(String),
    });
  });

  it('does allow the method if the origin is allowed', async () => {
    const snap = await installSnap();

    const response = await snap.request({
      origin: 'http://localhost:8000',
      method: 'snap.internal.clearAllRequests',
    });

    expect(response.response).toMatchObject({ result: null });
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
