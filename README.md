# GetFit Frontend

React + Vite SPA for the GetFit meals personalization product. Auth is handled by a Supabase Edge Function (copyable from `scripts/`). The Meals API lives on Cloud Run.

## Stack

- React 18 + TypeScript + Vite
- React Router v6
- TanStack Query v5
- Supabase JS (session persistence)
- Tailwind CSS
- react-tinder-card (swipe feed)
- nginx + Docker for Cloud Run

## Quick start

```bash
npm install
cp .env.example .env.local
# fill in VITE_* values
npm run dev
# → http://localhost:5173
```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_AUTH_FUNCTION_URL` | Deployed auth Edge Function URL |
| `VITE_API_BASE_URL` | Meals API Cloud Run URL (leave empty locally to use Vite `/api` proxy → `localhost:3000`) |
| `VITE_API_KEY` | Optional Meals API key |

All `VITE_*` values are baked into the client bundle at build time.

### Auth Edge Function

Copy [`scripts/supabase-auth-edge-function`](scripts/supabase-auth-edge-function) into your Supabase project and deploy as `auth`. See that folder’s README for secrets and deploy commands.

The frontend calls the function for signup/login. On signup, the function creates a Meals API profile and stores `meals_profile_id` in user metadata.

### Local API proxy

`vite.config.ts` proxies `/api` → `http://localhost:3000` so you can leave `VITE_API_BASE_URL` empty during local development (avoids CORS when talking to a local Meals API).

## Screens

| Route | Description |
|-------|-------------|
| `/login`, `/signup` | Auth via Edge Function |
| `/onboarding` | Optional AI-guided preference setup |
| `/home` | Swipe recommendation feed |
| `/recipe/:recipeId` | Recipe detail + feedback |
| `/generate` | AI recipe generator |
| `/chat` | Recommendation chat (server-owned session) |
| `/history` | Shown recipes + feedback tabs |
| `/profile` | Profile, constraints, preferences, sign out |

### Onboarding (optional)

Onboarding is not required to use the app. Visiting `/onboarding` (e.g. after signup) automatically starts a chat session:

1. `POST /api/agent/chat` with `X-User-Id` and body `{ "message": "I'm new, help me set up my food preferences" }` (no `sessionId` yet)
2. Save returned `sessionId` locally
3. Continue in `/chat` — each later turn sends `{ "sessionId": "...", "message": "..." }` plus the same `X-User-Id` header

Users can still skip and manage constraints/preferences later in Profile.

### Chat (server-owned session)

The Meals `/api/agent/chat` endpoint owns conversation history. The client:

1. Sends only the latest `{ message }` plus previous `sessionId` when continuing
2. Identifies the user with `X-User-Id` (not in the JSON body)
3. Persists `sessionId` and UI bubbles in `localStorage` (`getfit_chat_state`)
4. Renders `response.text` for the assistant bubble (does not send a transcript)
5. Clears local chat state on sign-out / Clear chat

Use `GET /api/recommendations` for structured swipe cards. Use chat when the user is typing.

## Docker

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  --build-arg VITE_AUTH_FUNCTION_URL=... \
  --build-arg VITE_API_BASE_URL=... \
  --build-arg VITE_API_KEY=... \
  -t getfit-frontend .

docker run -p 8080:8080 getfit-frontend
# → http://localhost:8080
```

## Deploy to Cloud Run

```bash
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1
export IMAGE=gcr.io/$PROJECT_ID/getfit-frontend

docker build \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  --build-arg VITE_AUTH_FUNCTION_URL=... \
  --build-arg VITE_API_BASE_URL=... \
  --build-arg VITE_API_KEY=... \
  -t $IMAGE .

docker push $IMAGE

gcloud run deploy getfit-frontend \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

Add the Cloud Run URL to:

1. Supabase Auth allowed redirect / site URLs
2. Meals API CORS allowed origins (backend task)

Backend CORS must allow headers `Content-Type`, `X-Api-Key`, and `X-User-Id`.

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # Typecheck + production build
npm run preview   # Preview production build
npm run lint      # Oxlint
```
