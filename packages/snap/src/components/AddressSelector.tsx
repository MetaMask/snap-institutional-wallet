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

import type { OnboardingAccount } from '../onboarding';
import { FormConstants, FormPrefixes } from '../onboarding';

type AddressSelectorProps = {
  accounts: OnboardingAccount[];
};

/**
 * Description: Get the etherscan link for the address
 *
 * @param address - The address to get the etherscan link for
 * @returns string the etherscan link for the address
 */
function getAccountLink(address: string) {
  return `https://etherscan.io/address/${address}`;
}

/**
 * Description: Truncate the address to the first 6 and last 4 characters
 *
 * @param address - The address to truncate
 * @returns string the truncated address
 */
function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const AddressSelector: SnapComponent<AddressSelectorProps> = ({
  accounts,
}: {
  accounts: OnboardingAccount[];
}) => {
  if (accounts.length === 0) {
    return (
      <Container>
        <Box>
          <Heading>No accounts found</Heading>
        </Box>
        <Footer>
          <Button name={FormConstants.cancel}>Cancel</Button>
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
        <Button name={FormConstants.confirm}>Confirm</Button>
        <Button name={FormConstants.cancel}>Cancel</Button>
      </Footer>
    </Container>
  );
};
