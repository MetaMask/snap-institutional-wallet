/* eslint-disable @typescript-eslint/naming-convention */
import type { MethodMapping } from '@open-rpc/server-js/build/router';

import { custodianCreateTransaction } from './handlers/custodianCreateTransaction';
import { custodianGetSignedMessageById } from './handlers/custodianGetSignedMessageById';
import { custodianGetSignedMessageLink } from './handlers/custodianGetSignedMessageLink';
import { custodianGetTransactionById } from './handlers/custodianGetTransactionById';
import { custodianListAccountChainIds } from './handlers/custodianListAccountChainIds';
import { custodianListAccounts } from './handlers/custodianListAccounts';
import { custodianSign } from './handlers/custodianSign';
import { custodianSignTypedData } from './handlers/custodianSignTypedData';

export const methodMapping: MethodMapping = {
  custodian_listAccounts: custodianListAccounts,
  custodian_listAccountChainIds: custodianListAccountChainIds,
  custodian_sign: custodianSign,
  custodian_signTypedData: custodianSignTypedData,
  custodian_getSignedMessageLink: custodianGetSignedMessageLink,
  custodian_getSignedMessageById: custodianGetSignedMessageById,
  custodian_createTransaction: custodianCreateTransaction,
  custodian_getTransactionById: custodianGetTransactionById,
};
