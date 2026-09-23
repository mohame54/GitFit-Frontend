const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Options extends RequestInit {
  skipUserId?: boolean;
}

export async function api<T>(
  path: string,
  init: Options = {},
  profileId?: string | null,
): Promise<T> {
  const { skipUserId, ...fetchInit } = init;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(import.meta.env.VITE_API_KEY
      ? { 'X-Api-Key': import.meta.env.VITE_API_KEY }
      : {}),
    ...(!skipUserId && profileId ? { 'X-User-Id': profileId } : {}),
    ...((fetchInit.headers as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchInit,
    headers,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : body && typeof body === 'object' && 'message' in body
          ? String((body as { message: unknown }).message)
          : response.statusText;
    throw new Error(message);
  }

  return body as T;
}
