import type { MessageTypes, TypedMessage } from '@metamask/eth-sig-util';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';

import { saveState } from '../../stateManagement';
import type { KeyringState } from '../types/CustodialKeyring';
import type { ICustodianApi } from '../types/ICustodianApi';

export class SignatureHandler {
  #state: KeyringState;

  constructor(state: KeyringState) {
    this.#state = state;
  }

  async signTypedData(
    from: string,
    data: TypedMessage<MessageTypes>,
    requestId: string,
    custodianApi: ICustodianApi,
    opts: { version: SignTypedDataVersion } = {
      version: SignTypedDataVersion.V4,
    },
  ): Promise<string> {
    if (!data) {
      throw new Error('Typed data is required');
    }

    const response = await custodianApi.signTypedData_v4(
      from,
      data,
      opts.version,
      { chainId: '0x420' },
    );

    this.#state.pendingSignMessages[requestId] = response.id;
    await saveState(this.#state);

    return response.id;
  }

  async signPersonalMessage(
    from: string,
    request: string,
    requestId: string,
    custodianApi: ICustodianApi,
  ): Promise<string> {
    const response = await custodianApi.signPersonalMessage(from, request, {
      chainId: '0x420',
    });

    this.#state.pendingSignMessages[requestId] = response.id;
    await saveState(this.#state);

    return response.id;
  }

  async removePendingSignMessage(id?: string): Promise<void> {
    if (!id || !this.#state.pendingSignMessages[id]) {
      return;
    }
    delete this.#state.pendingSignMessages[id];
    await saveState(this.#state);
  }
}
