Custodians are responsible for maintaining the list of accounts a user can access.

These can correspond to private keys held in a HSM, EOAs that are controlled by shared secrets, or any other mechanism that allows the custodian to sign transactions on behalf of the user. Contract wallets are also supported, although they generally cannot sign messages.

The custodial snap, once authenticated, will ask the custodian for a list of accounts for this user using the custodian_listAccounts method of the Ethereum Custodian API.
