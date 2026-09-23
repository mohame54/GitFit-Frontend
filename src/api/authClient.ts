import type { AuthResponse } from '@/types/api';

const AUTH_URL = import.meta.env.VITE_AUTH_FUNCTION_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callAuth(
  action: 'signup' | 'login',
  payload: {
    email: string;
    password: string;
    displayName?: string;
  },
): Promise<AuthResponse> {
  if (!AUTH_URL) {
    throw new Error('VITE_AUTH_FUNCTION_URL is not configured');
  }

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ANON_KEY
        ? {
            Authorization: `Bearer ${ANON_KEY}`,
            apikey: ANON_KEY,
          }
        : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : response.statusText;
    throw new Error(message);
  }

  return body as AuthResponse;
}

export function signup(email: string, password: string, displayName: string) {
  return callAuth('signup', { email, password, displayName });
}

export function login(email: string, password: string) {
  return callAuth('login', { email, password });
}
