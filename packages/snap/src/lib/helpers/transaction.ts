import type { TypedTransaction } from '@ethereumjs/tx';
import { TransactionFactory } from '@ethereumjs/tx';

import logger from '../../logger';
import { createCommon, formatTransactionData } from '../../util';
import { hexlify } from '../../util/hexlify';
import { TRANSACTION_TYPES } from '../constants';
import type { EthSignTransactionRequest } from '../types/EthSignTransactionRequest';
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
    if (transaction.signedRawTransaction) {
      logger.info('Transaction is signed', transaction.signedRawTransaction);

      const tx = this.getTypedTransaction(transaction, chainId);
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

  static getTypedTransaction(
    transactionDetails: ITransactionDetails,
    chainId: string,
  ): TypedTransaction {
    if (!transactionDetails.signedRawTransaction) {
      throw new Error('Transaction is not signed');
    }

    const common = createCommon(transactionDetails, chainId);

    const signedRawTransaction = Buffer.from(
      transactionDetails.signedRawTransaction.substring(2),
      'hex',
    );

    const tx = TransactionFactory.fromSerializedData(signedRawTransaction, {
      common,
    });

    return tx;
  }

  /**
   * We need to be certain that the custodian did not alter any of the fields
   * which was previously allowed in MMI but cannot work in the institutional snap
   * because the snap keyring does not allow us to return anything other than the signature
   *
   * @param request - The original request we got from the keyring
   * @param transactionDetails - The transaction details we got from the custodian
   */

  static validateTransaction(
    request: EthSignTransactionRequest,
    transactionDetails: ITransactionDetails,
  ): {
    isValid: boolean;
    error?: string;
  } {
    const tx = this.getTypedTransaction(transactionDetails, request.chainId);
    // Validated nonce, gas price, maxFeePerGas, maxPriorityFeePerGas and gas limit
    if (Number(request.nonce) !== Number(tx.nonce)) {
      return {
        isValid: false,
        error: `Custodian altered the nonce from the request: ${Number(
          request.nonce,
        )} to ${Number(tx.nonce)}`,
      };
    }
    if (
      'gasPrice' in request &&
      'gasPrice' in tx &&
      Number(request.gasPrice) !== Number(tx.gasPrice)
    ) {
      return {
        isValid: false,
        error: `Custodian altered the gas price from the request: ${request.gasPrice} to ${tx.gasPrice}`,
      };
    }

    if (
      'maxFeePerGas' in request &&
      'maxFeePerGas' in tx &&
      Number(request.maxFeePerGas) !== Number(tx.maxFeePerGas)
    ) {
      return {
        isValid: false,
        error: `Custodian altered the maxFeePerGas from the request: ${request.maxFeePerGas} to ${tx.maxFeePerGas}`,
      };
    }

    if (
      'maxPriorityFeePerGas' in request &&
      'maxPriorityFeePerGas' in tx &&
      Number(request.maxPriorityFeePerGas) !== Number(tx.maxPriorityFeePerGas)
    ) {
      return {
        isValid: false,
        error: `Custodian altered the maxPriorityFeePerGas from the request: ${request.maxPriorityFeePerGas} to ${tx.maxPriorityFeePerGas}`,
      };
    }

    return {
      isValid: true,
    };
  }
}
