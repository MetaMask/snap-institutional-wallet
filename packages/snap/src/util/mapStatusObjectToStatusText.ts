type StatusDictionary = {
  finished: boolean;
  submitted?: boolean;
  signed: boolean;
  success: boolean;
  displayText: string;
};

/**
 *
 * @param status
 */
export function mapStatusObjectToStatusText(status: StatusDictionary): string {
  if (status.finished && status.submitted && status.signed && status.success) {
    return 'mined';
  }

  if (status.finished && status.submitted && status.signed && !status.success) {
    return 'failed';
  }

  if (status.submitted && !status.finished) {
    return 'submitted';
  }

  if (status.signed && !status.submitted) {
    return 'signed';
  }

  if (!status.signed && !status.finished) {
    return 'created';
  }

  if (!status.signed && status.finished) {
    return 'aborted';
  }

  return 'unknown';
}
