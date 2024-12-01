# Local Custodian API

The local custodian API partly implements the [Ethereum Custodian API version 3](https://consensys-vertical-apps.github.io/ethereum-custodian-api/) (ECA-3) for use with the custodial snap.

It makes available a refresh token API at 

http://localhost:3330/oauth/token

and an ECA-3 endpoint at 

http://localhost:3330/v3/json-rpc

You can onboard accounts onto the snap using this method

```
    const params = {
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'local:http://localhost:8080',
        request: {
          method: 'authentication.onboard',
          params: {
            token: 'abc',
            custodianType: 'ECA',
            custodianDisplayName: 'Local Custodian',
            custodianEnvironment: 'local-dev',
            custodianApiUrl: 'http://localhost:3330', // the /v3/json is added automatically by the snap
            refreshTokenUrl: 'http://localhost:3330/oauth/token'
          }
        }
      }
    };
```

# Requirements

The accounts are generated from the mnemonic configured in the `.env` file as `MNEMONIC`.

The API also requires an Infura project ID configured in the `.env` file as `INFURA_PROJECT_ID`. This is used to obtain the nonce for transactions.

The API supports these chains, however it is only intended to be used with Sepolia.

Since there is no authentication, it's recommended to not store funds with any actual value.

```
  '0x1': 'mainnet',
  '0x89': 'polygon',
  '0x4268': 'holesky',
  '0xe705': 'linea-sepolia',
  '0xe708': 'linea-mainnet',
  '0x13882': 'polygon-amoy',
  '0xaa36a7': 'sepolia',
```

# Installation

```
yarn install

```

# Running

```
yarn start
```
