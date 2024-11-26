import { MethodMapping } from "@open-rpc/server-js/build/router";
import { custodianListAccounts } from "./handlers/custodianListAccounts";
import { custodianListAccountChainIds } from "./handlers/custodianListAccountChainIds";
import { custodianSign } from "./handlers/custodianSign";
import { custodianGetSignedMessageById } from "./handlers/custodianGetSignedMessageById";

export const methodMapping: MethodMapping = {
  "custodian_listAccounts": custodianListAccounts,
  "custodian_listAccountChainIds": custodianListAccountChainIds,
  "custodian_sign": custodianSign,
  "custodian_getSignedMessageById": custodianGetSignedMessageById,
};
export default methodMapping;
