# Copyable Supabase Edge Function — Auth

Deploy the contents of this folder as a Supabase Edge Function named `auth`.

## Setup

1. Create the function in your Supabase project:
   ```bash
   supabase functions new auth
   ```
2. Replace the generated `index.ts` with [`index.ts`](./index.ts) from this folder.
3. Set function secrets:
   ```bash
   supabase secrets set \
     MEALS_API_BASE_URL=https://meals-api-xxxx-uc.a.run.app \
     MEALS_API_KEY=your-meals-api-key
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are usually available automatically in Edge Functions.
4. Deploy:
   ```bash
   supabase functions deploy auth
   ```
5. Set `VITE_AUTH_FUNCTION_URL` in the frontend to:
   `https://<project-ref>.supabase.co/functions/v1/auth`

## API

`POST` JSON body:

```json
{ "action": "signup", "email": "...", "password": "...", "displayName": "..." }
```

```json
{ "action": "login", "email": "...", "password": "..." }
```

Response includes `session`, `user`, `profileId`, and `onboardingComplete`.
