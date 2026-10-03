#!/usr/bin/env bash
# Runs the production build. Set ORIGIN to the public URL when hosting.
cd "$(dirname "$0")"
export DATABASE_URL="${DATABASE_URL:-local.db}"
export OTP_MODE="${OTP_MODE:-demo}"
export STAFF_PIN="${STAFF_PIN:-1234}"
export PORT="${PORT:-3000}"
export ORIGIN="${ORIGIN:-http://localhost:$PORT}"
# the origin is baked in at build time, so rebuild when it changes
if [ ! -d build ] || [ "$(cat build/.origin 2>/dev/null)" != "$ORIGIN" ]; then
	npm run build && echo "$ORIGIN" > build/.origin
fi
exec node build
