import config, { setDevMode } from './config';

describe('setDevMode', () => {
  it('should set the dev mode', () => {
    setDevMode(true);
    expect(config.dev).toBe(true);
  });
});
