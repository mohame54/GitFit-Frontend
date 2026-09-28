# Stage 1 — build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Optional overrides. Do not ENV empty values — that shadows .env.production.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
ARG VITE_API_KEY

RUN if [ -z "$VITE_SUPABASE_URL" ]; then unset VITE_SUPABASE_URL; fi && \
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then unset VITE_SUPABASE_ANON_KEY; fi && \
    if [ -z "$VITE_API_BASE_URL" ]; then unset VITE_API_BASE_URL; fi && \
    if [ -z "$VITE_API_KEY" ]; then unset VITE_API_KEY; fi && \
    npm run build

# Stage 2 — serve
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8000

CMD ["nginx", "-g", "daemon off;"]
