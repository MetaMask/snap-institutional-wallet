import { ListAccountChainIdsPayload } from "../types/rpc-payloads/ListAccountChainIdsPayload";
import { ListAccountChainIdsResponse } from "../types/rpc-responses/ListAccountChainIdsResponse";
import accounts from "../custodian/accounts";

export const custodianListAccountChainIds = async (address : ListAccountChainIdsPayload[0]) : Promise<ListAccountChainIdsResponse> => {

    const keyringAccounts = await accounts.getAccounts();

    const account = keyringAccounts.find((account) => account.address === address);

    return account?.supportedChains || [];
}