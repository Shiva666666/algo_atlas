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

if [[ ! -d node_modules || ! -f node_modules/.package-lock.json || package-lock.json -nt node_modules/.package-lock.json ]]; then
  npm ci
fi

NEEDS_BUILD="$($VENV_PYTHON - <<'PY'
from pathlib import Path

output = Path("dist/index.html")
if not output.exists():
    print("1")
    raise SystemExit
output_time = output.stat().st_mtime
inputs = [Path("package.json"), Path("package-lock.json"), Path("vite.config.ts"), Path("tsconfig.json"), Path("index.html")]
for directory in (Path("src"), Path("app"), Path("server"), Path("public")):
    if directory.exists():
        inputs.extend(path for path in directory.rglob("*") if path.is_file())
print("1" if any(path.exists() and path.stat().st_mtime > output_time for path in inputs) else "0")
PY
)"
if [[ "$NEEDS_BUILD" == "1" ]]; then
  npm run build
fi

mkdir -p .local
"$VENV_PYTHON" -m algo_atlas.bootstrap

if ! "$VENV_PYTHON" - <<'PY'
import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=1) as response:
        raise SystemExit(0 if response.status == 200 else 1)
except Exception:
    raise SystemExit(1)
PY
then
  nohup "$VENV_PYTHON" -m uvicorn algo_atlas.main:app --host 127.0.0.1 --port 8000 > .local/server.log 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > .local/server.pid
  READY=0
  for _attempt in $(seq 1 40); do
    if "$VENV_PYTHON" - <<'PY'
import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=1) as response:
        raise SystemExit(0 if response.status == 200 else 1)
except Exception:
    raise SystemExit(1)
PY
    then
      READY=1
      break
    fi
    sleep 0.25
  done
  if [[ "$READY" != "1" ]]; then
    echo "Algo Atlas did not start. Recent server output:" >&2
    tail -n 40 .local/server.log >&2 || true
    exit 1
  fi
fi

if [[ "$NO_BROWSER" != "1" ]]; then
  open "http://127.0.0.1:8000/"
fi
echo "Algo Atlas is running at http://127.0.0.1:8000/"
