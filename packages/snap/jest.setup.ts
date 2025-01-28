import { jest } from '@jest/globals';

import logger from './src/logger';
import { MockSnapProvider } from './test/snap-provider.mock';

// Mock the console methods
jest.spyOn(logger, 'log').mockImplementation(() => {
  /* no-op */
});
jest.spyOn(logger, 'info').mockImplementation(() => {
  /* no-op */
});
jest.spyOn(logger, 'warn').mockImplementation(() => {
  /* no-op */
});
jest.spyOn(logger, 'error').mockImplementation(() => {
  /* no-op */
});

// eslint-disable-next-line no-restricted-globals
const globalAny: any = global;

globalAny.snap = new MockSnapProvider();
