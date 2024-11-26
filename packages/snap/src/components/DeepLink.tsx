import { Heading, Box, Text, Container, Link } from '@metamask/snaps-sdk/jsx';
import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

import type { CustodialKeyringAccountOptions } from '../lib/types/CustodialKeyringAccount';
import type { CustodianDeepLink } from '../lib/types/CustodianDeepLink';

type DeepLinkProps = {
  custodianDeepLink: CustodianDeepLink | null;
  options: CustodialKeyringAccountOptions;
};

export const DeepLink: SnapComponent<DeepLinkProps> = ({
  custodianDeepLink,
  options,
}: {
  custodianDeepLink: CustodianDeepLink | null;
  options: CustodialKeyringAccountOptions;
}) => {
  // Some custodians return null so we should set some default text

  const text =
    custodianDeepLink?.text ??
    custodianDeepLink?.text ??
    `Approve your ${custodianDeepLink} in the ${options.custodian.displayName} interface`;

  // Some custodians do not return an action so we should set some default text

  const action = custodianDeepLink?.action ?? 'Approve';

  // Some custodians do not return a links so we should not render the link element

  const link = custodianDeepLink?.url ? (
    <Link href={custodianDeepLink.url}>{action}</Link>
  ) : null;

  return (
    <Container>
      <Box key="dialog-content">
        <Heading>Approve transaction</Heading>
        <Text>{text}</Text>
        <Box center>{link}</Box>
      </Box>
    </Container>
  );
};
