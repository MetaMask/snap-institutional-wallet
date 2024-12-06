# JSON-RPC provider

!!! info "Terminology information"
This document refers to the `injected RPC provider` also known as `window.ethereum`. This is the provider that is injected into the browser by Metamask. It does not refer to the JSON-RPC endpoint served by the custodian, or the JSON-RPC provider endpoint served by Ethereum nodes.

The browser ethereum provider is used by dapps to communicate with the extension, and is the primary way that dapps interact with the user's wallet. The provider is a JavaScript object that is injected into the browser by the extension. The provider is accessible at `window.ethereum` in the browser. It is also used by custodians to communicate with the extension while the user is interacting with the custodian's UI.

### Initial connection

In order to first check if the institutional snap is installed and to use later method, it's first necessary to establish a connection.

```
await window.ethereum.request({
  method: "wallet_requestSnaps",
  params: {
    "npm:@metamask/institutional-wallet-snap": {},
  },
})
```

Once the custodian is fully integrated, the custodian UI can be added as an initial connection and this step can be skipped.

## authentication.onboard : Inject the token

Several values here will depend on the your integration process.

- `token` is the token that the user will be prompted to enter into the extension. This is the token that the user will use to authenticate with the custodian's API.
- `custodianApiUrl` is the base URL of the custodian's API. This does not include `/v3/json-rpc` or end in a trailing slash
- `refreshTokenUrl` is the URL of the custodian's token refresh endpoint. This does not include `/oauth/token` and does not end in a trailing slash
- `custodianEnvironment` is the name corresponding to the environment that the custodian is deployed to and will be listed in `custodianMetadata`
- `custodianType` will be `ECA3` for custodians using the ECA-3 API

```typescript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@metamask/institutional-wallet-snap',
    request: {
      method: 'authentication.onboard',
      params: {
        token: 'abc',
        custodianType: 'ECA3',
        custodianDisplayName: 'Neptune',
        custodianEnvironment: 'neptune-dev',
        custodianApiUrl:
          'https://neptune-custody.dev.metamask-institutional.io/eth',
        refreshTokenUrl:
          'https://neptune-custody.dev.metamask-institutional.io/oauth/token',
      },
    },
  },
});
```
