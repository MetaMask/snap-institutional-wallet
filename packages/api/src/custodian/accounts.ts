import keyring from './keyring';

type EthereumAccount = {
  address: string;
  name: string;
  supportedChains: string[];
};

class Accounts {
  private accounts: EthereumAccount[] = [];

  public async getAccounts(): Promise<EthereumAccount[]> {
    const accounts = await keyring.getAccounts();
    return accounts.map((address: string, index: number) => ({
      address: address,
      name: `Account ${index}`,
      supportedChains: ['0x1'],
    }));
  }

  public async signMessage(address: string, message: string): Promise<string> {
    return keyring.signPersonalMessage(address, message);
  }
}

export default new Accounts();
