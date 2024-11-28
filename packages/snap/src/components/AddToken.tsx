import {
  Heading,
  Box,
  Container,
  Button,
  Footer,
  Field,
  Input,
  Form,
} from '@metamask/snaps-sdk/jsx';
import type { SnapComponent, SnapElement } from '@metamask/snaps-sdk/jsx';

import { custodianMetadata } from '../lib/custodian-types/custodianMetadata';

export type AddTokenProps = {
  custodianName?: string;
};

export const AddToken: SnapComponent<AddTokenProps> = ({
  custodianName,
}: AddTokenProps): SnapElement => {
  if (!custodianName) {
    throw new Error('Custodian name is required');
  }

  const selectedCustodian = custodianMetadata.find(
    (custodian) => custodian.name === custodianName,
  );
  return (
    <Container>
      <Box>
        <Heading>Add Refresh Token</Heading>
        <Form name="addTokenForm">
          <Field label="Paste your Refresh Token">
            <Input name="token" placeholder="Enter your Refresh Token" />
          </Field>
          <Field label={`${!selectedCustodian?.displayName} API URL`}>
            <Input name="apiUrl" placeholder={selectedCustodian?.apiBaseUrl} />
          </Field>
        </Form>
      </Box>
      <Footer>
        <Button name="cancel-token">Cancel</Button>
        <Button name={`connect-token-${custodianName}`}>Connect</Button>
      </Footer>
    </Container>
  ) as SnapElement;
};
