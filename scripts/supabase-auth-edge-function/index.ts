// Copy this file into a Supabase Edge Function, e.g. supabase/functions/auth/index.ts
//
// Required Edge Function secrets / env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY
//   MEALS_API_BASE_URL
//   MEALS_API_KEY (optional)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MEALS_API_BASE_URL = Deno.env.get('MEALS_API_BASE_URL')!;
const MEALS_API_KEY = Deno.env.get('MEALS_API_KEY') ?? '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AuthAction = 'signup' | 'login';

interface AuthRequest {
  action: AuthAction;
  email: string;
  password: string;
  displayName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as AuthRequest;

    if (!body.email || !body.password || !body.action) {
      return json({ error: 'Missing required fields' }, 400);
    }

    if (body.action === 'signup') {
      return await signup(body);
    }

    if (body.action === 'login') {
      return await login(body);
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});

async function signup(body: AuthRequest) {
  if (!body.displayName) {
    return json({ error: 'displayName is required for signup' }, 400);
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        display_name: body.displayName,
      },
    });

  if (authError || !authData.user) {
    return json({ error: authError?.message ?? 'Failed to create user' }, 400);
  }

  const profile = await createMealsProfile(body.displayName);

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    authData.user.id,
    {
      user_metadata: {
        display_name: body.displayName,
        meals_profile_id: profile.id,
        onboarding_complete: false,
      },
    },
  );

  if (updateError) {
    return json({ error: updateError.message }, 400);
  }

  const session = await createPasswordSession(body.email, body.password);

  return json({
    user: session.user,
    session: session.session,
    profileId: profile.id,
    onboardingComplete: false,
  });
}

async function login(body: AuthRequest) {
  const session = await createPasswordSession(body.email, body.password);

  const profileId =
    (session.user.user_metadata?.meals_profile_id as string | undefined) ??
    null;
  const onboardingComplete =
    session.user.user_metadata?.onboarding_complete === true;

  return json({
    user: session.user,
    session: session.session,
    profileId,
    onboardingComplete,
  });
}

async function createPasswordSession(email: string, password: string) {
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new Error(error?.message ?? 'Failed to create session');
  }

  return data;
}

async function createMealsProfile(displayName: string) {
  const response = await fetch(`${MEALS_API_BASE_URL}/api/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(MEALS_API_KEY ? { 'X-Api-Key': MEALS_API_KEY } : {}),
    },
    body: JSON.stringify({ displayName }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error ?? body?.message ?? 'Failed to create meals profile',
    );
  }

  return body as { id: string };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
