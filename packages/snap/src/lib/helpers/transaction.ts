import { TransactionFactory } from '@ethereumjs/tx';

import logger from '../../logger';
import { createCommon, formatTransactionData } from '../../util';
import { hexlify } from '../../util/hexlify';
import { TRANSACTION_TYPES } from '../constants';
import type { ITransactionDetails } from '../types/ITransactionDetails';
import type { IEIP1559TxParams, ILegacyTXParams } from '../types/ITXParams';

export class TransactionHelper {
  static createTransactionPayload(tx: any): IEIP1559TxParams | ILegacyTXParams {
    const isEIP1559 = tx.maxFeePerGas !== undefined;
    const basePayload = {
      ...tx,
      type: isEIP1559 ? TRANSACTION_TYPES.EIP1559 : TRANSACTION_TYPES.LEGACY,
      data: formatTransactionData(tx.data),
    };

    if (isEIP1559) {
      return {
        ...basePayload,
        maxFeePerGas: tx.maxFeePerGas
          ? BigInt(tx.maxFeePerGas).toString()
          : '0',
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas
          ? BigInt(tx.maxPriorityFeePerGas).toString()
          : '0',
      };
    }

    return {
      ...basePayload,
      gasPrice: tx.gasPrice ? BigInt(tx.gasPrice).toString() : '0',
    };
  }

  static async getTransactionSignature(
    transaction: ITransactionDetails,
    chainId: string,
  ): Promise<{ v: string; r: string; s: string }> {
    const common = createCommon(transaction, chainId);

    if (transaction.signedRawTransaction) {
      logger.info('Transaction is signed', transaction.signedRawTransaction);
      const signedRawTransaction = Buffer.from(
        transaction.signedRawTransaction.substring(2),
        'hex',
      );

      const tx = TransactionFactory.fromSerializedData(signedRawTransaction, {
        common,
      });

      return {
        v: hexlify(tx.v?.toString() ?? '0'),
        r: hexlify(tx.r?.toString() ?? '0'),
        s: hexlify(tx.s?.toString() ?? '0'),
      };
    }
    // Get the signature from the global ethereum provider

    logger.debug(
      'Fetching signature from the network',
      transaction.transactionHash,
    );
    // Use the global ethereum provider to get the transaction hash

    const tx = (await ethereum.request({
      method: 'eth_getTransactionByHash',
      params: [transaction.transactionHash],
    })) as { v: string; r: string; s: string };

    logger.debug('Got signature from the network', tx);

    return {
      v: tx.v,
      r: tx.r,
      s: tx.s,
    };
  }
}
