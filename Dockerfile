# Stage 1 — build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Stage 2 — serve
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8000

# Writes /env-config.js from the Cloud Run environment, then starts nginx.
ENTRYPOINT ["/docker-entrypoint.sh"]
