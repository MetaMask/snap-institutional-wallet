## API

As a custodian, you must build an API for the institutional wallet snap to interact with. You should then submit a PR to this repository adding the details of your API to the `custodianMetadata.ts` file.

Custodians must expose the following endpoints:

- An endpoint that exchanges the refresh token for an access token. It should follow [this specification](../../authentication/). High level explanations of each method are provided [here](../methods).
- An instance of the [Custodian JSON-RPC API](https://consensys-vertical-apps.github.io/ethereum-custodian-api/) version 3. Please not that we no longer support adding custodians using older versions of the API.
- A [JWKS endpoint](https://datatracker.ietf.org/doc/html/rfc7517) which is publically accessible or accessible through HTTP Basic Auth. This exposes public keys for verifying the [Customer proof](../customer-proof). An example of this format is given [here](https://codefi.eu.auth0.com/.well-known/jwks.json)

## JSON RPC API notes

### Versioning

The URL for the custodian JSON-RPC API contain a major version and follow the pattern BASE_URL + `/v{$MAJOR_VERSION}/json-rpc` - e.g. https://custodian-api/eth/v3/json-rpc

Thus, when the major version of the specification is upgraded, we can maintain continuity.

### Error handling

See [JSON-RPC Errors](../errors).
