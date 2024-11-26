import { mapTransactionStatus } from './map-status';

describe('mapTransactionStatus', () => {
  it('should map created', () => {
    const result = mapTransactionStatus('created', 'some reason');
    expect(result).toEqual({
      finished: false,
      submitted: false,
      signed: false,
      success: false,
      displayText: 'Created',
      reason: 'some reason',
    });
  });

  it('should map signed', () => {
    const result = mapTransactionStatus('signed', 'some reason');
    expect(result).toEqual({
      finished: false,
      submitted: false,
      signed: true,
      success: false,
      displayText: 'Signed',
      reason: 'some reason',
    });
  });

  it('should map submitted', () => {
    const result = mapTransactionStatus('submitted', 'some reason');
    expect(result).toEqual({
      finished: false,
      submitted: true,
      signed: true,
      success: false,
      displayText: 'Submitted',
      reason: 'some reason',
    });
  });

  it('should map completed', () => {
    const result = mapTransactionStatus('completed', 'some reason');
    expect(result).toEqual({
      finished: true,
      submitted: true,
      signed: true,
      success: true,
      displayText: 'Completed',
      reason: 'some reason',
    });
  });

  it('should map mined', () => {
    const result = mapTransactionStatus('mined', 'some reason');
    expect(result).toEqual({
      finished: true,
      submitted: true,
      signed: true,
      success: true,
      displayText: 'Mined',
      reason: 'some reason',
    });
  });

  it('should map failed', () => {
    const result = mapTransactionStatus('failed', 'some reason');
    expect(result).toEqual({
      finished: true,
      submitted: true,
      signed: true,
      success: false,
      displayText: 'Failed',
      reason: 'some reason',
    });
  });

  it('should map aborted', () => {
    const result = mapTransactionStatus('aborted', 'some reason');
    expect(result).toEqual({
      finished: true,
      submitted: false,
      signed: false,
      success: false,
      displayText: 'Aborted',
      reason: 'some reason',
    });
  });

  it('should map rejected', () => {
    const result = mapTransactionStatus('rejected', 'some reason');
    expect(result).toEqual({
      finished: true,
      submitted: false,
      signed: false,
      success: false,
      displayText: 'Rejected',
      reason: 'some reason',
    });
  });

  it('should map unknown', () => {
    const result = mapTransactionStatus('unknown');
    expect(result).toEqual({
      finished: false,
      submitted: false,
      signed: false,
      success: false,
      displayText: 'Unknown',
      reason: '',
    });
  });
});
