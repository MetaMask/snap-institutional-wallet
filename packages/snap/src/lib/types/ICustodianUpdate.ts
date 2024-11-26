export type ICustodianUpdate = {
  transaction?: {
    id: string; // This must match the transaction ID from the custodian_createTransaction method
    type: string; // In hexlified (0x...) format
    from: string; // Hexlified
    to: string; // Contract address or recipient (hexlified)
    value: string; // Can be null, 0x, 0x0 etc
    gas: string; // Hexlified
    gasPrice?: string; // Hexlified
    maxFeePerGas?: string; // Hexlified
    maxPriorityFeePerGas?: string; // Hexlified
    nonce: string; // Hexlified
    data: string; //  Can be null, 0x, 0x0 etc
    hash: string;
    status: {
      finished: boolean; // This transaction is finished - it has failed, or succeeded (been mined). There will be no more webhooks
      submitted: boolean; // The transaction has been submitted to the blockchain
      signed: boolean; // The transaction has been signed, and the nonce/hash is available
      success: boolean; // The transaction was successful, or is successful so far.
      displayText: string; // Text which is displayed to users
      reason: string; // The reason for the transaction status - for example, the failure reason
    };
  };
  signedMessage?: {
    id: string; // This must match the signature ID from the custodian_sign or custodian_signTypeData method
    address: string; // Hexlified
    signatureVersion: string; // v3, v4 or personalSign
    signature: string; // The hexlified signature
    status: {
      finished: boolean;
      signed: boolean;
      success: boolean;
      displayText: string;
      reason?: string; // The reason for the transaction status
    };
  };
  metadata: {
    userId: string; // This must match the `sub` claim of the customer proof of the user who created the transaction
    customerId: string; // If users are part of some group, e.g. an organisation or fund, a unique ID for this organisation or fund (used for billing)
    customerName: string; // If users are part of some group, e.g. an organisation or fund, a human readable name for this organisation or fund (used for billing)
    chainId?: string; // In hexlified (0x...) format. Not usually included for signed messages
    originUrl?: string; // As passed from the extension when the transaction was created
    transactionCategory?: string; // As passed from the extension when the transaction was created
    note?: string; // As passed from the extension when the transaction was created
    traceId?: string; // An ID for the webhook, which could be used for debugging
  };
};
