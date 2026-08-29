#!/bin/bash
set -euo pipefail

ATLAS_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PID_FILE="$ATLAS_ROOT/.local/server.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "Algo Atlas is not running."
  exit 0
fi

SERVER_PID="$(tr -d '[:space:]' < "$PID_FILE")"
if [[ ! "$SERVER_PID" =~ ^[0-9]+$ ]]; then
  echo "The Algo Atlas PID file is invalid; it was not used." >&2
  exit 1
fi
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  rm -f "$PID_FILE"
  echo "Algo Atlas was already stopped."
  exit 0
fi

PROCESS_COMMAND="$(ps -p "$SERVER_PID" -o command= 2>/dev/null || true)"
if [[ "$PROCESS_COMMAND" != *"uvicorn"* || "$PROCESS_COMMAND" != *"algo_atlas.main:app"* ]]; then
  echo "PID $SERVER_PID does not belong to Algo Atlas; no process was stopped." >&2
  exit 1
fi

kill "$SERVER_PID"
for _attempt in $(seq 1 20); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    break
  fi
  sleep 0.1
done
rm -f "$PID_FILE"
echo "Algo Atlas stopped."
