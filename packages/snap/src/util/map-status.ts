type Status = {
  finished: boolean;
  signed: boolean;
  success: boolean;
  displayText: string;
  reason: string;
};
type TransactionStatus = {
  submitted: boolean;
} & Status;

/**
 *
 * @param status
 * @param reason
 */
export function mapTransactionStatus(
  status: string,
  reason?: string,
): TransactionStatus {
  switch (status) {
    case 'created':
      return {
        finished: false,
        submitted: false,
        signed: false,
        success: false,
        displayText: 'Created',
        reason: reason ?? '',
      };
    case 'signed':
      return {
        finished: false,
        submitted: false,
        signed: true,
        success: false,
        displayText: 'Signed',
        reason: reason ?? '',
      };
    case 'submitted':
      return {
        finished: false,
        submitted: true,
        signed: true,
        success: false,
        displayText: 'Submitted',
        reason: reason ?? '',
      };
    case 'mined':
      return {
        finished: true,
        submitted: true,
        signed: true,
        success: true,
        displayText: 'Mined',
        reason: reason ?? '',
      };
    case 'completed':
      return {
        finished: true,
        submitted: true,
        signed: true,
        success: true,
        displayText: 'Completed',
        reason: reason ?? '',
      };
    case 'failed':
      return {
        finished: true,
        submitted: true,
        signed: true,
        success: false,
        displayText: 'Failed',
        reason: reason ?? '',
      };
      break;
    case 'rejected':
      return {
        finished: true,
        submitted: false,
        signed: false,
        success: false,
        displayText: 'Rejected',
        reason: reason ?? '',
      };
    case 'aborted':
      return {
        finished: true,
        submitted: false,
        signed: false,
        success: false,
        displayText: 'Aborted',
        reason: reason ?? '',
      };
      break;
    case 'confirmed':
      return {
        finished: true,
        submitted: true,
        signed: true,
        success: true,
        displayText: 'Confirmed',
        reason: reason ?? '',
      };
    default:
      return {
        finished: false,
        submitted: false,
        signed: false,
        success: false,
        displayText: 'Unknown',
        reason: reason ?? '',
      };
  }
}
