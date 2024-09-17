type RequestOptions = Omit<RequestInit, 'body'> & { body?: any };

export async function fetcher<TResponse>(
  url: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const { body, ...restOptions } = options;

  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Fetch request failed: ${error}`);
  }
}

export const phoneNumberRegex = /^(\(\d{3}\)\s?|\d{3}-)\d{3}-\d{4}$/;
