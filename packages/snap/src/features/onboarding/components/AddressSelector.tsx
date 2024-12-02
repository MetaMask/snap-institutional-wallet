import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Divider,
  Checkbox,
  Box,
  Button,
  Heading,
  Container,
  Footer,
  Link,
} from '@metamask/snaps-sdk/jsx';

import { getAccountLink, truncateAddress } from '../../../util';
import type { OnboardingAccount } from '../types';
import { FormPrefixes, OnboardingNames } from '../types';

type AddressSelectorProps = {
  accounts: OnboardingAccount[];
};

export const AddressSelector: SnapComponent<AddressSelectorProps> = ({
  accounts,
}) => {
  if (accounts.length === 0) {
    return (
      <Container>
        <Box>
          <Heading>No accounts found</Heading>
        </Box>
        <Footer>
          <Button name={OnboardingNames.CancelButton}>Cancel</Button>
        </Footer>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        <Heading>Accounts</Heading>
        {accounts.map((account) => (
          <Box key={account.address}>
            <Checkbox
              name={`${FormPrefixes.addressSelector}${account.address}`}
              label={account.name}
            />
            <Link href={getAccountLink(account.address)}>
              {truncateAddress(account.address)}
            </Link>
            <Divider />
          </Box>
        ))}
      </Box>
      <Footer>
        <Button name={OnboardingNames.CancelButton}>Cancel</Button>
        <Button name={OnboardingNames.ConfirmButton}>Confirm</Button>
      </Footer>
    </Container>
  );
};
