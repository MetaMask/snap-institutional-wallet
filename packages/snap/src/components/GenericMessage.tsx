import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
// eslint-disable-next-line @typescript-eslint/no-shadow
import { Heading, Box, Text, Container } from '@metamask/snaps-sdk/jsx';

type GenericMessageProps = {
  title: string;
  message: string;
};

export const GenericMessage: SnapComponent<GenericMessageProps> = ({
  title,
  message,
}) => {
  return (
    <Container>
      <Box>
        <Heading>{title}</Heading>
        <Text>{message}</Text>
      </Box>
    </Container>
  );
};
