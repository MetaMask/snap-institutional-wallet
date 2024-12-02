import {
  Heading,
  Box,
  Container,
  Text,
  Button,
  Footer,
  Section,
  Image,
  Link,
} from '@metamask/snaps-sdk/jsx';
import type { SnapComponent, SnapElement } from '@metamask/snaps-sdk/jsx';

import bitgoLogo from '../../../../images/bitgo.svg';
import cactusLogo from '../../../../images/cactus.svg';
import fireblocksLogo from '../../../../images/fireblocks.svg';
import gk8Logo from '../../../../images/gk8.svg';
import icon from '../../../../images/icon.svg';
import mpcvaultLogo from '../../../../images/mpcvault.svg';
import neptuneLogo from '../../../../images/neptune.svg';
import safeLogo from '../../../../images/safe.svg';
import zodiaLogo from '../../../../images/zodia.svg';
import type { CustodianMetadata } from '../../../lib/custodian-types/custodianMetadata';
import { custodianMetadata } from '../../../lib/custodian-types/custodianMetadata';
import type { CustodialKeyringAccount } from '../../../lib/types/CustodialKeyringAccount';
import { HomePageNames, HomePagePrefixes } from '../types';

const custodianLogos: Record<string, string> = {
  'bitgo-prod': bitgoLogo,
  'gk8-prod': gk8Logo,
  'gk8-eca3-prod': gk8Logo,
  'safe-prod': safeLogo,
  'mpcvault-prod': mpcvaultLogo,
  'fireblocks-prod': fireblocksLogo,
  'neptune-custody-dev': neptuneLogo,
  'zodia-prod': zodiaLogo,
  cactus: cactusLogo,
};

type CustodianListProps = {
  accounts?: CustodialKeyringAccount[];
};

export const CustodianList: SnapComponent<CustodianListProps> = ({
  accounts,
}): SnapElement => {
  const renderSelect = (custodian: CustodianMetadata) => {
    if (
      custodian.name.startsWith('gk8') ||
      custodian.name.startsWith('neptune')
    ) {
      return (
        <Button name={`${HomePagePrefixes.SelectCustodian}${custodian.name}`}>
          Select
        </Button>
      );
    }
    if (custodian.onboardingUrl) {
      return <Link href={custodian.onboardingUrl}>Select</Link>;
    }
    return null;
  };

  return (
    <Container>
      <Box>
        <Heading>Select custodian</Heading>
        <Text>
          Connect your existing accounts or select a custody or self-custody
          solution
        </Text>
        {custodianMetadata
          .filter((custodian) => custodian.enabled)
          .map((custodian) => (
            <Section
              key={custodian.name}
              direction="horizontal"
              alignment="space-between"
            >
              <Box direction="horizontal">
                <Image src={custodianLogos[custodian.name] ?? icon} />
                <Text>{custodian.displayName}</Text>
              </Box>
              {renderSelect(custodian)}
            </Section>
          ))}
      </Box>
      <Footer>
        <Button
          name={HomePageNames.RemoveCustodianToken}
          disabled={!accounts?.length}
        >
          Remove custodian token
        </Button>
      </Footer>
    </Container>
  ) as SnapElement;
};
