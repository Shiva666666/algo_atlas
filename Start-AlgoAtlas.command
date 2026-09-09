#!/bin/bash
set -euo pipefail

ATLAS_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ATLAS_ROOT"

NO_BROWSER=0
if [[ "${1:-}" == "--no-browser" ]]; then
  NO_BROWSER=1
elif [[ $# -gt 0 ]]; then
  echo "Usage: ./Start-AlgoAtlas.command [--no-browser]" >&2
  exit 2
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3.11 or newer is required. Install it with: brew install python@3.11" >&2
  exit 1
fi
if ! python3 -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)'; then
  echo "Python 3.11 or newer is required. Current version: $(python3 --version 2>&1)" >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 22.13 or newer and npm are required. Install them with: brew install node@22" >&2
  exit 1
fi
if ! node -e 'const [major,minor]=process.versions.node.split(".").map(Number);process.exit(major>22||(major===22&&minor>=13)?0:1)'; then
  echo "Node.js 22.13 or newer is required. Current version: $(node --version 2>&1)" >&2
  exit 1
fi

if [[ ! -x ".venv/bin/python" ]]; then
  python3 -m venv .venv
fi
VENV_PYTHON="$ATLAS_ROOT/.venv/bin/python"
"$VENV_PYTHON" -m pip install -e .

if [[ "$("$VENV_PYTHON" -m algo_atlas.launcher dependency-status)" == "stale" ]]; then
  npm ci
  "$VENV_PYTHON" -m algo_atlas.launcher mark-dependencies >/dev/null
fi
if [[ "$("$VENV_PYTHON" -m algo_atlas.launcher frontend-status)" == "stale" ]]; then
  npm run build
  "$VENV_PYTHON" -m algo_atlas.launcher mark-frontend >/dev/null
fi

mkdir -p .local
PID_FILE="$ATLAS_ROOT/.local/server.pid"
if [[ -f "$PID_FILE" ]]; then
  SERVER_PID="$(tr -d '[:space:]' < "$PID_FILE")"
  if [[ ! "$SERVER_PID" =~ ^[0-9]+$ ]]; then
    echo "The Algo Atlas PID file is invalid. Verify the server before removing .local/server.pid." >&2
    exit 1
  fi
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    PROCESS_COMMAND="$(ps -p "$SERVER_PID" -o command= 2>/dev/null || true)"
    if [[ "$PROCESS_COMMAND" != *"$VENV_PYTHON -m uvicorn"* || "$PROCESS_COMMAND" != *"algo_atlas.main:app"* ]]; then
      echo "PID $SERVER_PID does not belong to this Algo Atlas checkout. No process was stopped." >&2
      exit 1
    fi
    kill "$SERVER_PID"
    for ((_attempt=0; _attempt<50; _attempt++)); do
      if ! kill -0 "$SERVER_PID" 2>/dev/null; then break; fi
      sleep 0.1
    done
    if kill -0 "$SERVER_PID" 2>/dev/null; then
      echo "Algo Atlas server PID $SERVER_PID did not stop." >&2
      exit 1
    fi
  fi
  rm -f "$PID_FILE"
fi

if [[ "$("$VENV_PYTHON" -m algo_atlas.launcher port-status --port 8000)" != "free" ]]; then
  echo "Port 8000 is already used by another process. Algo Atlas did not stop or replace that process." >&2
  exit 1
fi

BOOTSTRAP_RESULT="$("$VENV_PYTHON" -m algo_atlas.bootstrap)"
echo "$BOOTSTRAP_RESULT"
if ! "$VENV_PYTHON" -c 'import json,sys; raise SystemExit(0 if json.loads(sys.argv[1]).get("conflicts",0)==0 else 1)' "$BOOTSTRAP_RESULT"; then
  echo "Algorithm sync conflicts need review in Settings & Sync. Local data was preserved." >&2
fi

nohup "$VENV_PYTHON" -m uvicorn algo_atlas.main:app --host 127.0.0.1 --port 8000 > .local/server.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

READY=0
for ((_attempt=0; _attempt<40; _attempt++)); do
  if [[ "$("$VENV_PYTHON" -m algo_atlas.launcher health-status)" == "ready" ]]; then
    READY=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then break; fi
  sleep 0.25
done
if [[ "$READY" != "1" ]]; then
  kill "$SERVER_PID" 2>/dev/null || true
  rm -f "$PID_FILE"
  echo "Algo Atlas did not start. Recent server output:" >&2
  tail -n 40 .local/server.log >&2 || true
  exit 1
fi

if [[ "$NO_BROWSER" != "1" ]]; then
  open "http://127.0.0.1:8000/"
fi
echo "Algo Atlas is running with the latest pulled UI and algorithms at http://127.0.0.1:8000/"
