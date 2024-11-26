import fetchMock from 'jest-fetch-mock';

import factory from './json-rpc-call';

fetchMock.enableMocks();

describe('json-rpc-call', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
  });

  describe('json-rpc-call', () => {
    it('should call the JSON RPC endpoint with the appropriate method and parameters', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ result: 'test' }));
      const call = factory('http://test/json-rpc');

      await call('test', { some: 'parameter' }, 'access_token');

      expect(fetchMock).toHaveBeenCalledWith('http://test/json-rpc', {
        body: '{"jsonrpc":"2.0","id":1,"method":"test","params":{"some":"parameter"}}',
        credentials: 'same-origin',
        headers: {
          Authorization: 'Bearer access_token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    });

    it('should throw an error if there is an error.message property in the response', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          error: {
            message: 'Test error',
          },
        }),
      );

      const call = factory('http://test/json-rpc');

      await expect(
        call('test', { some: 'parameter' }, 'access_token'),
      ).rejects.toThrow('Test error');
    });
  });
});
