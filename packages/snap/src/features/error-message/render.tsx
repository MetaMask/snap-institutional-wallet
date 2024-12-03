/**
 * Renders the onboarding interface.
 *
 * @param errorMessage - The error message to display.
 * @returns The result of the dialog.
 */
export async function renderErrorMessage(errorMessage: string) {
  await snap.request({
    method: 'snap_notify',
    params: {
      type: 'inApp',
      message: errorMessage,
    },
  });
}
