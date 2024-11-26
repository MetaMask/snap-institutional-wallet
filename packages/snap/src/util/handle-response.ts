/**
 *
 * @param message
 * @param response
 */
function handleError(message: string, response: Response): never {
  const errorMessage = `${message}. URL: ${response.url}`;
  console.error(errorMessage, { headers: response.headers, url: response.url });
  throw new Error(errorMessage);
}

/**
 *
 * @param response
 * @param contextErrorMessage
 */
export async function handleResponse<T>(
  response: Response,
  contextErrorMessage?: string,
): Promise<T> {
  let errorMsg = `Error with request. Status: ${response.status} Status text: ${
    response.statusText
  }. URL: ${response.url}. ${contextErrorMessage || ''}`;

  if (!response.ok) {
    try {
      const errorData = await response.json();
      errorMsg += errorData.error?.message
        ? `. Error message: ${errorData.error.message}`
        : `. Error message: ${errorData.message}`;
      handleError(errorMsg, response);
    } catch (error) {
      handleError(`Failed to parse JSON. ${errorMsg}`, response);
    }
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    handleError(`Failed to parse JSON. ${errorMsg}`, response);
  }
}
