# Authentication

When users import their custodial accounts, they enter a refresh token, or multiple tokens for access to multiple accounts. This token is used to fetch access tokens use to make requests to the custodian API. See below for the specification of the token refresh endpoint.

All requests made by the institutional snap to the Ethereum Custodian API (JSON-RPC API) will use this access token.

!!! important Custodians must keep separate any tokens issued to users (for example, in the custodian UI) that are capable of signing transactions. In other words, credentials used in the institutional snap should never have the capability to actually cause transfer of funds.

If the custodian has a web UI, they should implement a button or link that takes advantage of RPC Onboarding.

If the custodian only has a desktop application, they can host a webpage which takes the token (or a reference to the token) as a parameter and injects it as above.

## Token refresh endpoint

Your refresh token endpoint must support application/json request bodies.

## Example requests

Here are some example requests. that would be made by the institutional snap to your refresh token endpoint.

```json
application/json
POST /your-token-refresh-endpoint HTTP/1.1
Host: whatever-your-domain.is
Content-Type: application/json

{
    "grant_type" : "refresh_token",
    "refresh_token" : "THE_REFRESH_TOKEN"
}
```

## Example responses

This is the response made by your refresh token endpoint in response to the above requests.

```json
{
    "access_token": "THE_ACCESS_TOKEN",
    "refresh_token": "THE_REFRESH_TOKEN",
    "scope" : "",
    "token_type": "bearer",
    "expires_in": 86400 // This is the expiry of the access token
}

## Refresh token lifecycle
It is intended that refresh tokens should last a long time, if not forever. However, if your security policies dictate that all tokens must be rotated, you can implement a non-interactive token replacement.

### Non-interactive token replacement

Any time the institutional snap encounters a refresh token in the `refresh_token` field of the response from the token refresh endpoint which is different from the stored refresh token, it will be saved as the new refresh token for any accounts that were onboarded using the old token.


## FAQ

### Are refresh tokens securely stored?
The institutional snap stores the custodian refresh token in a vault (keyring) which is encrypted while the extension is locked. After injection, this token never leaves the vault. The security is the same as MetaMask's storage of private keys and seed phrases.

### Does the institutional snap support Oauth 2.0?
The institutional snap does not use a standard Oauth 2.0 flow. However, it does contain elements of the client credentials grant and the refresh token grant. This is to facilitate custodian web applications, mobile apps, and desktop applications.

The user provides, from the custodian, a refresh token. The institutional snap uses this token to obtain the actual token for accompanying requests.

Ideally, this token is issued in a non-interactive way; i.e. the credential exchange happens at the custodian and this is effectively a Machine-to-Machine token. Since the institutional snap is an extension and not an ordinary web application, it cannot accept redirects.x
```
