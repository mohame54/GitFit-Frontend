#!/bin/sh
set -eu

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "$(json_escape "${VITE_SUPABASE_URL:-}")",
  VITE_SUPABASE_ANON_KEY: "$(json_escape "${VITE_SUPABASE_ANON_KEY:-}")",
  VITE_API_BASE_URL: "$(json_escape "${VITE_API_BASE_URL:-}")",
  VITE_API_KEY: "$(json_escape "${VITE_API_KEY:-}")"
};
EOF

exec nginx -g 'daemon off;'
