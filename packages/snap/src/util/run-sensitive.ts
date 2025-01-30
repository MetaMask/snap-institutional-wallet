/**
 * Runs the specified callback and throws an error with the specified message
 * if it fails.
 *
 * This function should be used to run code that may throw error messages that
 * could expose sensitive information.
 *
 * @param callback - Callback to run.
 * @param message - Error message to throw if the callback fails.
 * @returns The result of the callback.
 */
export function runSensitive<Type>(
  callback: () => Type,
  message?: string,
): Type {
  try {
    return callback();
  } catch (error) {
    throw new Error(message ?? 'An unexpected error occurred');
  }
}
