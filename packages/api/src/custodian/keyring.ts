// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import HDKeyring from '@metamask/eth-hd-keyring';
import dotenv from 'dotenv';

dotenv.config();

const keyring = new HDKeyring({
  numberOfAccounts: 10,
  mnemonic: process.env.MNEMONIC,
});

export default keyring;
