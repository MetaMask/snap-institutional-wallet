import custodianRequests from '../custodian/requests';
import type { GetTransactionByIdResponse } from '../types/rpc-responses/GetTransactionByIdResponse';

export const custodianGetTransactionById = async (
  id: string,
): Promise<GetTransactionByIdResponse | null> => {
  console.log('custodianGetTransactionById', id);
  const localTransaction = custodianRequests.getTransaction(id);
  if (!localTransaction) {
    return null;
  }
  const { transaction, metadata } = localTransaction;
  // map to rpc response
  const rpcResponse: GetTransactionByIdResponse = {
    transaction: {
      id: transaction.id as string,
      type: transaction.type,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      gas: transaction.gas,
      gasPrice: transaction.gasPrice ?? '',
      maxFeePerGas: transaction.maxFeePerGas ?? '',
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ?? '',
      nonce: transaction.nonce as string,
      data: transaction.data,
      hash: transaction.hash as string,
      status: transaction.status as {
        finished: boolean;
        submitted: boolean;
        signed: boolean;
        success: boolean;
        displayText: string;
      },
      ...(transaction.signedRawTransaction
        ? { signedRawTransaction: transaction.signedRawTransaction }
        : {}),
    },
    metadata: {
      chainId: metadata.chainId,
      rpcUrl: metadata.rpcUrl,
      custodianPublishesTransaction: metadata.custodianPublishesTransaction,
    },
  };
  return rpcResponse;
};
