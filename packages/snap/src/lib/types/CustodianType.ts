import { BitgoCustodianApi } from '../custodian-types/bitgo/BitgoCustodianApi';
import { CactusCustodianApi } from '../custodian-types/cactus/CactusCustodianApi';
import { ECA1CustodianApi } from '../custodian-types/eca1/ECA1CustodianApi';
import { ECA3CustodianApi } from '../custodian-types/eca3/ECA3CustodianApi';

export enum CustodianType {
  ECA3 = 'ECA3',
  ECA1 = 'ECA1',
  BitGo = 'BitGo',
  Cactus = 'Cactus',
}

// Commenting out the broken custodians for now

export const CustodianApiMap = {
  [CustodianType.ECA3]: ECA3CustodianApi,
  [CustodianType.ECA1]: ECA1CustodianApi,
  [CustodianType.BitGo]: BitgoCustodianApi,
  [CustodianType.Cactus]: CactusCustodianApi,
};
