/**
 * Handle a response.
 *
 * @param response - The response.
 * @param contextErrorMessage - The context error message.
 * @returns The response data.
 */
export async function handleResponse<ResponseType>(
  response: Response,
  contextErrorMessage?: string,
): Promise<ResponseType> {
  let errorMsg = `Error with request. Status: ${response.status} Status text: ${
    response.statusText
  }. URL: ${response.url}. ${contextErrorMessage ?? ''}`;

  if (!response.ok) {
    const errorData = await response.json();

    if (errorData.error?.message) {
      errorMsg += `. Error message: ${errorData.error.message as string}`;
    } else if (errorData.message) {
      errorMsg += `. Error message: ${errorData.message as string}`;
    }

    throw new Error(errorMsg);
  }

  let data: ResponseType;
  try {
    data = (await response.json()) as ResponseType;
  } catch (error) {
    throw new Error(`Failed to parse JSON. ${errorMsg}`);
  }

  return data;
}
