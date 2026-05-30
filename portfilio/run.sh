#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT="${PORT:-8080}"

PAGE="${1:-raj_portfolio.html}"

if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/${PAGE}" 2>/dev/null; then
  echo "Server already running on http://localhost:${PORT}/${PAGE}"
else
  echo "Starting server at http://localhost:${PORT}/${PAGE}"
  python3 -m http.server "$PORT" &
  sleep 1
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:${PORT}/${PAGE}"
elif command -v firefox >/dev/null 2>&1; then
  firefox "http://localhost:${PORT}/${PAGE}"
else
  echo "Open http://localhost:${PORT}/${PAGE} in your browser"
fi
