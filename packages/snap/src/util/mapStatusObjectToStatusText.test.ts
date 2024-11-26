import { mapStatusObjectToStatusText } from './mapStatusObjectToStatusText';

describe('mapStatusObjectToStatusText', () => {
  it('returns "mined" if the status object is finished and submitted and successful', () => {
    const status = {
      finished: true,
      submitted: true,
      signed: true,
      success: true,
      displayText: 'test',
    };

    expect(mapStatusObjectToStatusText(status)).toBe('mined');
  });

  it('returns "failed" if the status object is finished and submitted and not successful', () => {
    const status = {
      finished: true,
      submitted: true,
      signed: true,
      success: false,
      displayText: 'test',
    };

    expect(mapStatusObjectToStatusText(status)).toBe('failed');
  });

  it('returns "submitted" if the status object is submitted and not finished', () => {
    const status = {
      finished: false,
      submitted: true,
      signed: true,
      success: false,
      displayText: 'test',
    };

    expect(mapStatusObjectToStatusText(status)).toBe('submitted');
  });

  it('returns "signed" if the status object is signed and not submitted', () => {
    const status = {
      finished: false,
      submitted: false,
      signed: true,
      success: false,
      displayText: 'test',
    };

    expect(mapStatusObjectToStatusText(status)).toBe('signed');
  });

  it('returns "created" if the status object is not signed', () => {
    const status = {
      finished: false,
      submitted: false,
      signed: false,
      success: false,
      displayText: 'test',
    };

    expect(mapStatusObjectToStatusText(status)).toBe('created');
  });

  it('returns "aborted" if the status object is not signed but is finished', () => {
    const status = {
      finished: true,
      submitted: false,
      signed: false,
      success: false,
      displayText: 'test',
    };

    expect(mapStatusObjectToStatusText(status)).toBe('aborted');
  });
});
