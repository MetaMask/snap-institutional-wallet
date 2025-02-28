import { jest } from '@jest/globals';

import { getStateData, setStateData, getClientStatus } from './snap-util';

// Mock the global snap object
const mockSnap = {
  request: jest.fn<(...args: any[]) => Promise<any>>(),
};

(global as any).snap = mockSnap;

describe('snap-util', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  describe('getStateData', () => {
    it('should retrieve snap state successfully', async () => {
      const mockState = { foo: 'bar' } as any;
      mockSnap.request.mockResolvedValueOnce(mockState);

      const result = await getStateData(false);

      expect(result).toStrictEqual(mockState);
      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get', encrypted: false },
      });
    });

    it('should return null when no state exists', async () => {
      mockSnap.request.mockResolvedValueOnce(null);

      const result = await getStateData(false);

      expect(result).toBeNull();
      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get', encrypted: false },
      });
    });

    it('should throw error when snap request fails', async () => {
      const error = new Error('Failed to get state');
      mockSnap.request.mockRejectedValueOnce(error);

      await expect(getStateData(false)).rejects.toThrow('Failed to get state');
    });
  });

  describe('setStateData', () => {
    it('should set snap state successfully', async () => {
      const newState = { foo: 'bar' };
      mockSnap.request.mockResolvedValueOnce(undefined);

      await setStateData({ data: newState, encrypted: false });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState,
          encrypted: false,
        },
      });
    });

    it('should throw error when snap request fails', async () => {
      const newState = { foo: 'bar' };
      const error = new Error('Failed to set state');
      mockSnap.request.mockRejectedValueOnce(error);

      await expect(
        setStateData({ data: newState, encrypted: false }),
      ).rejects.toThrow('Failed to set state');
    });

    it('should handle setting null state', async () => {
      mockSnap.request.mockResolvedValueOnce(undefined);

      await setStateData({ data: null, encrypted: false });

      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: null,
          encrypted: false,
        },
      });
    });
  });

  describe('getClientStatus', () => {
    it('should retrieve client status successfully', async () => {
      const mockStatus = { locked: true };
      mockSnap.request.mockResolvedValueOnce(mockStatus);

      const result = await getClientStatus();

      expect(result).toStrictEqual(mockStatus);
      expect(mockSnap.request).toHaveBeenCalledWith({
        method: 'snap_getClientStatus',
      });
    });
  });
});
