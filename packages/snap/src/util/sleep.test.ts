import { getSleepState, setSleepState } from './sleep';

describe('sleep', () => {
  it('should get and set sleep state', async () => {
    const sleepState = await getSleepState();
    expect(sleepState).toBe(false);
  });

  it('should set sleep state', async () => {
    await setSleepState(true);
    const sleepState = await getSleepState();
    expect(sleepState).toBe(true);
  });
});
