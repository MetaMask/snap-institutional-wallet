import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Heading,
  Button,
  Box,
  Text,
  Copyable,
  Footer,
  Container,
} from '@metamask/snaps-sdk/jsx';

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
