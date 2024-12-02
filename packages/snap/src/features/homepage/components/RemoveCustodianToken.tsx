import {
  Heading,
  Box,
  Container,
  Text,
  Button,
  Footer,
  Section,
  Avatar,
} from '@metamask/snaps-sdk/jsx';
import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

import type { CustodialKeyringAccount } from '../../../lib/types/CustodialKeyringAccount';
import { HomePageNames } from '../types';

export type RemoveCustodianTokenProps = {
  accounts: CustodialKeyringAccount[];
};

export const RemoveCustodianToken: SnapComponent<RemoveCustodianTokenProps> = ({
  accounts,
}) => {
  return (
    <Container>
      <Box>
        <Heading>Remove Custodian Token</Heading>
        <Text>
          Are you sure you want to remove this toke? All custodial accounts
          assigned to this token will be removed from the extension as well.
        </Text>
        {accounts.map((account) => (
          <Section direction="horizontal" alignment="space-between">
            <Box direction="horizontal">
              <Avatar address={`eip155:1:${account.address}`} />
              <Box>
                {account.options.accountName ? (
                  <Text>{account.options.accountName}</Text>
                ) : null}
                <Text>
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </Text>
              </Box>
            </Box>
            <Text>{account.options.custodian.displayName}</Text>
          </Section>
        ))}
      </Box>
      <Footer>
        <Button name={HomePageNames.CancelRemoveToken}>Cancel</Button>
        <Button name={HomePageNames.RemoveToken}>Remove</Button>
      </Footer>
    </Container>
  );
};
