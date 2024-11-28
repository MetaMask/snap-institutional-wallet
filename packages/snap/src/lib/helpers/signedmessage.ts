import type { MessageTypes, TypedMessage } from '@metamask/eth-sig-util';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';

import type { ICustodianApi } from '../types/ICustodianApi';
import type { ISignedMessageDetails } from '../types/ISignedMessageDetails';

export class SignedMessageHelper {
  static async signTypedData(
    from: string,
    data: TypedMessage<MessageTypes>,
    custodianApi: ICustodianApi,
    opts: { version: SignTypedDataVersion } = {
      version: SignTypedDataVersion.V4,
    },
  ): Promise<ISignedMessageDetails> {
    if (!data) {
      throw new Error('Typed data is required');
    }

    const response = await custodianApi.signTypedData_v4(
      from,
      data,
      opts.version,
      { chainId: '0x420' },
    );

    return response;
  }

  static async signPersonalMessage(
    from: string,
    request: string,
    custodianApi: ICustodianApi,
  ): Promise<ISignedMessageDetails> {
    const response = await custodianApi.signPersonalMessage(from, request, {
      chainId: '0x420',
    });

    return response;
  }
}
