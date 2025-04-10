import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Checkbox } from '@metamask/snaps-sdk/jsx';

import { HomePageNames } from '../types';

export type ToggleDevModeProps = {
  devMode: boolean;
};

export const ToggleDevMode: SnapComponent<ToggleDevModeProps> = ({
  devMode,
}) => {
  return (
    <Box>
      <Checkbox
        checked={devMode}
        name={HomePageNames.ToggleDevMode}
        variant="toggle"
        label="Enable development custodians"
      />
    </Box>
  );
};
