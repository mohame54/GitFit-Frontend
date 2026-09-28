import { createClient } from '@supabase/supabase-js';
import { env } from '@/config';

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them as Cloud Run environment variables, or pass them as Docker --build-arg values.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
