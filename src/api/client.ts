import { supabase } from '@/auth/supabase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Not signed in');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(import.meta.env.VITE_API_KEY
      ? { 'X-Api-Key': import.meta.env.VITE_API_KEY }
      : {}),
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
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
