import type { HomePageContext } from './context';
import { onCancelTokenClick, onToggleDevMode } from './events';
import { HomePageNames } from './types';
import { updateInterface } from '../../lib/helpers/interface';

jest.mock('../..', () => ({
  handleOnboarding: jest.fn(),
  handleSetDevMode: jest.fn(),
}));

jest.mock('../../lib/helpers/interface', () => ({
  getInterfaceState: jest.fn(),
  updateInterface: jest.fn(),
}));

const mockUpdateInterface = updateInterface as jest.MockedFunction<
  typeof updateInterface
>;

type Element = {
  type?: string;
  props?: Record<string, unknown> & { children?: unknown };
};

/**
 * Finds the checked state of the dev mode toggle in a rendered element tree.
 *
 * @param element - The rendered element, as passed to `snap_updateInterface`.
 * @returns The checked state, or undefined if the toggle is not rendered.
 */
function devModeToggleChecked(element: unknown): boolean | undefined {
  if (!element || typeof element !== 'object') {
    return undefined;
  }

  if (Array.isArray(element)) {
    for (const child of element) {
      const checked = devModeToggleChecked(child);
      if (checked !== undefined) {
        return checked;
      }
    }
    return undefined;
  }

  const { type, props } = element as Element;
  if (type === 'Checkbox' && props?.name === HomePageNames.ToggleDevMode) {
    return Boolean(props.checked);
  }

  return devModeToggleChecked(props?.children);
}

describe('onToggleDevMode', () => {
  const context: HomePageContext = {
    activity: 'homepage',
    accounts: [],
    devMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists the new dev mode value in the interface context', async () => {
    await onToggleDevMode({
      id: 'interface-id',
      context,
      event: { type: 'InputChangeEvent', value: true },
    });

    expect(mockUpdateInterface).toHaveBeenCalledWith(
      'interface-id',
      expect.anything(),
      expect.objectContaining({ devMode: true }),
    );
  });

  // Later events re-render `CustodianList` from the persisted context, so a
  // stale `devMode` there makes the custodian filter and the toggle disagree
  // with what `setDevMode` stored.
  it('leaves a context that later events can re-render from', async () => {
    await onToggleDevMode({
      id: 'interface-id',
      context,
      event: { type: 'InputChangeEvent', value: true },
    });

    const persistedContext = mockUpdateInterface.mock
      .calls[0]?.[2] as HomePageContext;

    await onCancelTokenClick({ id: 'interface-id', context: persistedContext });

    expect(devModeToggleChecked(mockUpdateInterface.mock.calls[1]?.[1])).toBe(
      true,
    );
  });
});
