interface RuntimeEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_API_BASE_URL?: string;
  VITE_API_KEY?: string;
}

declare global {
  interface Window {
    __ENV__?: RuntimeEnv;
  }
}

function readEnv(key: keyof RuntimeEnv): string {
  const runtime = window.__ENV__?.[key];
  if (typeof runtime === 'string' && runtime.length > 0) return runtime;
  const built = import.meta.env[key];
  return typeof built === 'string' ? built : '';
}

/** Cloud Run env (window.__ENV__) wins. Vite build-time values are the fallback. */
export const env = {
  supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readEnv('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: readEnv('VITE_API_BASE_URL'),
  apiKey: readEnv('VITE_API_KEY'),
};
