/**
 * Renders the onboarding interface.
 *
 * @param infoMessage - The info message to display.
 * @returns The result of the dialog.
 */
export async function renderInfoMessage(infoMessage: string) {
  await snap.request({
    method: 'snap_notify',
    params: {
      type: 'inApp',
      message: infoMessage,
    },
  });
}
