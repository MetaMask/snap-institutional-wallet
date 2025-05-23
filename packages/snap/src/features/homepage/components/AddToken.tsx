import {
  Heading,
  Box,
  Container,
  Button,
  Footer,
  Field,
  Input,
  Form,
  Text,
} from '@metamask/snaps-sdk/jsx';
import type { SnapComponent, SnapElement } from '@metamask/snaps-sdk/jsx';

import { custodianMetadata } from '../../../lib/custodian-types/custodianMetadata';
import { HomePageNames, HomePagePrefixes } from '../types';

export type AddTokenProps = {
  custodianName?: string;
  error?: string;
};

export const AddToken: SnapComponent<AddTokenProps> = ({
  custodianName,
  error,
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
          <Field
            label={`${selectedCustodian?.displayName ?? 'Custodian'} API URL`}
          >
            <Input name="apiUrl" value={selectedCustodian?.apiBaseUrl} />
          </Field>
        </Form>
        {error ? <Text>{error}</Text> : null}
      </Box>
      <Footer>
        <Button name={HomePageNames.CancelToken}>Cancel</Button>
        <Button name={`${HomePagePrefixes.ConnectToken}${custodianName}`}>
          Connect
        </Button>
      </Footer>
    </Container>
  ) as SnapElement;
};
