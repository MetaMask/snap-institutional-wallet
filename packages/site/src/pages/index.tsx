import type { KeyringAccount, KeyringRequest } from '@metamask/keyring-api';
import { KeyringSnapRpcClient } from '@metamask/keyring-api';
import { Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useContext, useEffect, useState } from 'react';

import { Accordion, AccountList, Card, ConnectButton } from '../components';
import {
  CardContainer,
  Container,
  Divider,
  DividerTitle,
  StyledBox,
} from '../components/styledComponents';
import {
  defaultSnapOrigin,
  defaultCustodianApiUrl,
  defaultRefreshTokenUrl,
} from '../config';
import { MetaMaskContext, MetamaskActions } from '../hooks';
import { InputType } from '../types';
import type { KeyringState } from '../utils';
import { connectSnap, getSnap } from '../utils';

const initialState: {
  pendingRequests: KeyringRequest[];
  accounts: KeyringAccount[];
} = {
  pendingRequests: [],
  accounts: [],
};

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [snapState, setSnapState] = useState<KeyringState>(initialState);
  // Is not a good practice to store sensitive data in the state of
  // a component but for this case it should be ok since this is an
  // internal development and testing tool.
  const [accountId, setAccountId] = useState<string | null>();
  const [accountObject, setAccountObject] = useState<string | null>();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [signedMessageId, setSignedMessageId] = useState<string | null>(null);
  const [signedMessageIntent, setSignedMessageIntent] = useState<string | null>(
    'signed',
  );
  const [signedMessageIds, setSignedMessageIds] = useState<string[]>([]);
  const [transactionIds, setTransactionIds] = useState<string[]>([]);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionIntent, setTransactionIntent] = useState<string | null>(
    'signed',
  );

  // const [accountPayload, setAccountPayload] =
  //   useState<Pick<KeyringAccount, 'name' | 'options'>>();
  const client = new KeyringSnapRpcClient(state.snapId, window.ethereum);

  useEffect(() => {
    /**
     * Return the current state of the snap.
     *
     * @returns The current state of the snap.
     */
    async function getState() {
      if (!state.installedSnap) {
        return;
      }
      const accounts = await client.listAccounts();
      const pendingRequests = await client.listRequests();
      setSnapState({
        accounts,
        pendingRequests,
      });
    }

    getState().catch((error) => console.error(error));
  }, [state.installedSnap]);

  const syncAccounts = async () => {
    const accounts = await client.listAccounts();
    setSnapState({
      ...snapState,
      accounts,
    });
  };

  const injectToken = async (
    custodianApiUrl: string,
    refreshTokenUrl: string,
    custodianType = 'ECA3',
    custodianDisplayName = 'Neptune',
    custodianEnvironment = 'neptune-dev',
  ) => {
    const params = {
      method: 'wallet_invokeSnap',
      params: {
        snapId: state.snapId,
        request: {
          method: 'authentication.onboard',
          params: {
            token: 'abc',
            custodianType,
            custodianDisplayName,
            custodianEnvironment,
            custodianApiUrl,
            refreshTokenUrl,
          },
        },
      },
    };

    console.log(params);

    await window.ethereum.request(params);
  };

  const getConnectedAccounts = async (
    custodianApiUrl: string,
    custodianType: string,
    custodianEnvironment: string,
    token: string,
  ) => {
    const params = {
      method: 'wallet_invokeSnap',
      params: {
        snapId: state.snapId,
        request: {
          method: 'authentication.getConnectedAccounts',
          params: {
            custodianApiUrl,
            custodianType,
            custodianEnvironment,
            token,
          },
        },
      },
    };

    const response = await window.ethereum.request(params);
    return response;
  };

  const deleteAccount = async () => {
    await client.deleteAccount(accountId as string);
    await syncAccounts();
  };

  const updateAccount = async () => {
    if (!accountObject) {
      return;
    }
    const account: KeyringAccount = JSON.parse(accountObject);
    await client.updateAccount(account);
    await syncAccounts();
  };

  const handleConnectClick = async () => {
    try {
      await connectSnap(state.snapId);
      const installedSnap = await getSnap(state.snapId);

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  const accountManagementMethods = [
    {
      name: 'Inject local custodian token',
      description: 'Onboard to the local test custodian',
      inputs: [],
      action: {
        callback: async () =>
          await injectToken(
            defaultCustodianApiUrl,
            defaultRefreshTokenUrl,
            'ECA3',
            'Local Dev',
            'local-dev',
          ),
        label: 'Inject Token',
      },
      successMessage: 'Import successful',
    },
    {
      name: 'Inject neptune token',
      description: 'Onboard to the neptune test custodian',
      inputs: [],
      action: {
        callback: async () =>
          await injectToken(
            'https://neptune-custody.metamask-institutional.io/eth',
            'https://neptune-custody.metamask-institutional.io/oauth/token',
            'ECA3',
            'Neptune Custody',
            'neptune-custody-prod',
          ),
        label: 'Inject Token',
      },
      successMessage: 'Import successful',
    },

    {
      name: 'Inject local neptune token',
      description: 'Onboard to the local neptune test custodian',
      inputs: [],
      action: {
        callback: async () =>
          await injectToken(
            'http://localhost:3009/eth',
            'http://localhost:3009/oauth/token',
            'ECA3',
            'Local Neptune',
            'neptune-custody-local',
          ),
        label: 'Inject Token',
      },
      successMessage: 'Import successful',
    },

    {
      name: 'Inject saturn token',
      description: 'Onboard to the saturn test custodian',
      inputs: [],
      action: {
        callback: async () =>
          await injectToken(
            'https://saturn-custody.metamask-institutional.io/eth',
            'https://saturn-custody.metamask-institutional.io/oauth/token',
            'ECA1',
            'Saturn Custody',
            'saturn-prod',
          ),
        label: 'Inject Token',
      },
      successMessage: 'Import successful',
    },

    {
      name: 'Get connected accounts',
      description:
        'Get all accounts matching the connection details from the current origin (using local custodian details)',
      inputs: [],
      action: {
        callback: async () =>
          return getConnectedAccounts(
            defaultCustodianApiUrl,
            'ECA3',
            'local-dev',
            'abc',
          ),
        label: 'Get Connected Accounts',
      },
    },

    {
      name: 'Get account',
      description: 'Get data of the selected account (dev mode only)',
      inputs: [
        {
          id: 'get-account-account-id',
          title: 'Account ID',
          type: InputType.TextField,
          placeholder: 'E.g. f59a9562-96de-4e75-9229-079e82c7822a',
          options: snapState.accounts.map((account) => {
            return { value: account.address };
          }),
          onChange: (event: any) => setAccountId(event.currentTarget.value),
        },
      ],
      action: {
        disabled: Boolean(accountId),
        callback: async () => await client.getAccount(accountId as string),
        label: 'Get Account',
      },
      successMessage: 'Account fetched',
    },
    {
      name: 'List accounts',
      description: 'List all accounts managed by the snap (dev mode only)',
      action: {
        disabled: false,
        callback: async () => {
          const accounts = await client.listAccounts();
          setSnapState({
            ...snapState,
            accounts,
          });
          return accounts;
        },
        label: 'List Accounts',
      },
    },
    {
      name: 'Remove account',
      description: 'Remove an account (dev mode only)',
      inputs: [
        {
          id: 'delete-account-account-id',
          title: 'Account ID',
          type: InputType.TextField,
          placeholder: 'E.g. 394bd587-7be4-4ffb-a113-198c6a7764c2',
          options: snapState.accounts.map((account) => {
            return { value: account.address };
          }),
          onChange: (event: any) => setAccountId(event.currentTarget.value),
        },
      ],
      action: {
        disabled: Boolean(accountId),
        callback: async () => await deleteAccount(),
        label: 'Remove Account',
      },
      successMessage: 'Account Removed',
    },
    {
      name: 'Update account',
      description: 'Update an account (dev mode only)',
      inputs: [
        {
          id: 'update-account-account-object',
          title: 'Account Object',
          type: InputType.TextArea,
          placeholder: 'E.g. { id: ... }',
          onChange: (event: any) => setAccountObject(event.currentTarget.value),
        },
      ],
      action: {
        disabled: Boolean(accountId),
        callback: async () => await updateAccount(),
        label: 'Update Account',
      },
      successMessage: 'Account Updated',
    },
  ];

  const requestMethods = [
    {
      name: 'Get request',
      description: 'Get a pending request by ID',
      inputs: [
        {
          id: 'get-request-request-id',
          title: 'Request ID',
          type: InputType.TextField,
          placeholder: 'E.g. e5156958-16ad-4d5d-9dcd-6a8ba1d34906',
          onChange: (event: any) => setRequestId(event.currentTarget.value),
        },
      ],
      action: {
        enabled: Boolean(requestId),
        callback: async () => await client.getRequest(requestId as string),
        label: 'Get Request',
      },
    },
    {
      name: 'List requests',
      description: 'List pending requests',
      action: {
        disabled: false,
        callback: async () => {
          const requests = await client.listRequests();
          setSnapState({
            ...snapState,
            pendingRequests: requests,
          });
          return requests;
        },
        label: 'List Requests',
      },
    },
    {
      name: 'Approve request',
      description: 'Approve a pending request by ID',
      inputs: [
        {
          id: 'approve-request-request-id',
          title: 'Request ID',
          type: InputType.TextField,
          placeholder: 'E.g. 6fcbe1b5-f250-452c-8114-683dfa5ea74d',
          onChange: (event: any) => {
            setRequestId(event.currentTarget.value);
          },
        },
      ],
      action: {
        disabled: !requestId,
        callback: async () => await client.approveRequest(requestId as string),
        label: 'Approve Request',
      },
      successMessage: 'Request approved',
    },
    {
      name: 'Reject request',
      description: 'Reject a pending request by ID',
      inputs: [
        {
          id: 'reject-request-request-id',
          title: 'Request ID',
          type: InputType.TextField,
          placeholder: 'E.g. 424ad2ee-56cf-493e-af82-cee79c591117',
          onChange: (event: any) => {
            setRequestId(event.currentTarget.value);
          },
        },
      ],
      action: {
        disabled: !requestId,
        callback: async () => await client.rejectRequest(requestId as string),
        label: 'Reject Request',
      },
      successMessage: 'Request Rejected',
    },
    {
      name: 'Clear all requests',
      description: 'Clear the request state',
      action: {
        callback: async () => {
          const params = {
            method: 'wallet_invokeSnap',
            params: {
              snapId: state.snapId,
              request: {
                method: 'snap.internal.clearAllRequests',
                params: {},
              },
            },
          };
          await window.ethereum.request(params);
        },
        label: 'Clear Requests',
      },
      successMessage: 'Requests cleared',
    },
  ];

  const custodianTestMethods = [
    {
      name: 'Sign personal message',
      description: 'Sign a personal message',
      inputs: [],
      action: {
        callback: async () => {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = (await window.ethereum.request({
            method: 'eth_accounts',
          })) as string[];
          if (accounts.length === 0) {
            throw new Error('No accounts found');
          }
          const account = accounts[0];
          const message = 'Hello, world!';
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, account],
          });
          return signature;
        },
        label: 'Sign Message',
      },
    },

    {
      name: 'List custodian API requests',
      description: 'List all requests stored on the local test custodian API',
      action: {
        callback: async () => {
          const response = await fetch(
            `${defaultCustodianApiUrl}/list/requests`,
          );
          const data = await response.json();
          setSignedMessageIds(
            // eslint-disable-next-line id-denylist
            data.signedMessages.map((msg: { id: string }) => msg.id),
          );
          setTransactionIds(
            data.transactions.map(
              (tx: { transaction: { id: string } }) => tx.transaction.id,
            ),
          );
          return data;
        },
        label: 'List Requests',
      },
    },

    {
      name: 'Clear custodian API requests',
      description: 'Clear all requests stored on the local test custodian API',
      action: {
        callback: async () => {
          const response = await fetch(
            `${defaultCustodianApiUrl}/clear/requests`,
          );
          const data = await response.json();
          return data;
        },
        label: 'Clear Requests',
      },
    },
    {
      name: 'Update pending signed message',
      description:
        'Update a pending signed message stored on the local test custodian API',
      inputs: [
        {
          id: 'sign-message-signed-message-id',
          title: 'Signed Message ID',
          type: InputType.Dropdown,
          options: [
            { value: 'Select an option' },
            ...signedMessageIds.map((id) => ({ value: id })),
          ],
          onChange: (event: any) =>
            setSignedMessageId(event.currentTarget.value),
        },
        // choose intent - signed or failed
        {
          id: 'sign-message-intent',
          title: 'Intent',
          type: InputType.Dropdown,
          options: [{ value: 'signed' }, { value: 'failed' }],
          onChange: (event: any) =>
            setSignedMessageIntent(event.currentTarget.value),
        },
      ],
      action: {
        disabled: !signedMessageId,
        callback: async () => {
          if (!signedMessageId) {
            throw new Error('No signed message id');
          }
          const response = await fetch(
            `${defaultCustodianApiUrl}/update/signedMessage/${signedMessageId}`,
            {
              method: 'POST',
              body: JSON.stringify({ intent: signedMessageIntent }),
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
          const data = await response.json();
          return data;
        },
        label: 'Update Signed Message',
      },
    },

    {
      name: 'Create a Sepolia transaction',
      description: 'Create a pending Sepolia transaction in the extension',
      inputs: [],
      action: {
        callback: async () => {
          const payload = {
            method: 'eth_sendTransaction',
            params: [
              {
                chainId: '0xaa36a7',
                maxPriorityFeePerGas: '0x59682f00',
                maxFeePerGas: '0x45dbe936c',
                gasLimit: '0xc8f7',
                to: '0xfe7a0f0c76c136b9b438dcb27de9a1b618c016fc',
                value: '0x0',
                data: '0x97c5ed1e00000000000000000000000094b21bdbe1a2d4b09d048ab7d865a7d352da1a510000000000000000000000000000000000000000000000000de0b6b3a7640000',
                accessList: [],
                from: '0x94b21bdbe1a2d4b09d048ab7d865a7d352da1a51',
                type: '0x2',
              },
            ],
          };
          const response = await window.ethereum.request(payload);
          return response;
        },
        label: 'Create Transaction',
      },
    },

    {
      name: 'Update pending transaction',
      description:
        'Update a pending transaction stored on the local test custodian API',
      inputs: [
        {
          id: 'update-transaction-transaction-id',
          title: 'Transaction ID',
          type: InputType.Dropdown,
          options: [
            { value: 'Select an option' },
            ...transactionIds.map((id) => ({ value: id })),
          ],
          onChange: (event: any) => setTransactionId(event.currentTarget.value),
        },
        // choose intent - signed or failed
        {
          id: 'update-transaction-intent',
          title: 'Intent',
          type: InputType.Dropdown,
          options: [{ value: 'signed' }, { value: 'failed' }],
          onChange: (event: any) =>
            setTransactionIntent(event.currentTarget.value),
        },
      ],
      action: {
        disabled: !transactionId,
        callback: async () => {
          if (!transactionId) {
            throw new Error('No transaction id');
          }
          const response = await fetch(
            `${defaultCustodianApiUrl}/update/transaction/${transactionId}`,
            {
              method: 'POST',
              body: JSON.stringify({ intent: transactionIntent }),
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
          const data = await response.json();
          return data;
        },
        label: 'Update Transaction',
      },
    },
  ];

  return (
    <Container>
      <CardContainer>
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectClick}
                  disabled={!state.hasMetaMask}
                />
              ),
            }}
            disabled={!state.hasMetaMask}
          />
        )}
      </CardContainer>

      <CardContainer>
        <Card
          content={{
            title: 'Snap ID',
            description: 'Choose the Snap ID to connect with',
            button: (
              <Select
                value={state.snapId}
                onChange={(event: any) => {
                  dispatch({
                    type: MetamaskActions.SetSnapId,
                    payload: event.target.value,
                  });
                }}
                fullWidth
              >
                <MenuItem value={defaultSnapOrigin}>Local Development</MenuItem>
                <MenuItem value="npm:@metamask/institutional-wallet-snap">
                  NPM Package
                </MenuItem>
              </Select>
            ),
          }}
        />
      </CardContainer>

      <StyledBox sx={{ flexGrow: 1 }}>
        <Grid container spacing={4} columns={[1, 2, 3]}>
          <Grid item xs={8} sm={4} md={2}>
            <DividerTitle>Account Management Methods</DividerTitle>
            <Accordion items={accountManagementMethods} />
            <Divider />
            <DividerTitle>Request Methods</DividerTitle>
            <Accordion items={requestMethods} />
            <DividerTitle>Custodian Test Methods</DividerTitle>
            <Accordion items={custodianTestMethods} />
            <Divider />
          </Grid>
          <Grid item xs={4} sm={2} md={1}>
            <Divider />
            <DividerTitle>Accounts</DividerTitle>
            <AccountList
              accounts={snapState.accounts}
              handleDelete={async (accountIdToDelete) => {
                await client.deleteAccount(accountIdToDelete);
                const accounts = await client.listAccounts();
                setSnapState({
                  ...snapState,
                  accounts,
                });
              }}
            />
          </Grid>
        </Grid>
      </StyledBox>
    </Container>
  );
};

export default Index;
