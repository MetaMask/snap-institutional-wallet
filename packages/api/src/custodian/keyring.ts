import dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
import HDKeyring from '@metamask/eth-hd-keyring';

export default new HDKeyring({
  numberOfAccounts: 10,
  mnemonic: process.env.MNEMONIC,
});
