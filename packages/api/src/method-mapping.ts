/* eslint-disable @typescript-eslint/naming-convention */
import type { MethodMapping } from '@open-rpc/server-js/build/router';

import { custodianGetSignedMessageById } from './handlers/custodianGetSignedMessageById';
import { custodianListAccountChainIds } from './handlers/custodianListAccountChainIds';
import { custodianListAccounts } from './handlers/custodianListAccounts';
import { custodianSign } from './handlers/custodianSign';

export const methodMapping: MethodMapping = {
  custodian_listAccounts: custodianListAccounts,
  custodian_listAccountChainIds: custodianListAccountChainIds,
  custodian_sign: custodianSign,
  custodian_getSignedMessageById: custodianGetSignedMessageById,
};