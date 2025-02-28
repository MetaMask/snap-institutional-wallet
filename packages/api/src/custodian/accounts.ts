import {
  FeeMarketEIP1559Transaction,
  JsonTx,
  LegacyTransaction,
} from '@ethereumjs/tx';

import keyring from './keyring';

type EthereumAccount = {
  address: string;
  name: string;
  supportedChains: string[];
};

class Accounts {
  #accounts: EthereumAccount[] = [];

  public async getAccounts(): Promise<EthereumAccount[]> {
    const accounts = await keyring.getAccounts();
    return accounts.map((address: string, index: number) => ({
      address,
      name: `Account ${index}`,
      supportedChains: ['0x1'],
    }));
  }

  public async signPersonalMessage(
    address: string,
    message: string,
  ): Promise<string> {
    return keyring.signPersonalMessage(address, message);
  }

  public async signTypedData(address: string, data: string): Promise<string> {
    return keyring.signTypedData(address, data, { version: 'v4' });
  }

  public async signTransaction(
    address: string,
    transaction: any,
  ): Promise<any> {
    return keyring.signTransaction(address, transaction);
  }
}

const accounts = new Accounts();

export default accounts;
