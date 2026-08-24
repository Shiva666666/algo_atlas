# Algo Atlas

Algo Atlas is a local-first visual knowledge system for the coding problems you get wrong. It stores the authoritative catalog in SQLite, indexes titles, notes, tags, and Python code with FTS5, and produces deterministic Markdown/Python exports for a reviewed daily GitHub push.

## Start on Windows

Double-click `Start-AlgoAtlas.cmd`. The first run creates the Python environment and frontend build, then opens <http://127.0.0.1:8000/>. Later launches reuse the installed environment. Use `Stop-AlgoAtlas.ps1` when you want to stop the background server.

Prerequisites: Python 3.11+, Node.js 22+, npm, and Git.

## GitHub setup

1. Create an empty **private** repository on GitHub.
2. Open **Settings & Sync** in Algo Atlas.
3. Paste the GitHub remote URL and enter the Git name, email, and target branch.
4. Choose **Preview changes** to review the allowlisted export diff.
5. Choose **Commit & push**. Algo Atlas stages only `exports/`; it never stages the SQLite database, local backups, configuration, or unrelated source files.

Git authentication is delegated to your normal Git Credential Manager or SSH configuration. Credentials are never accepted or stored by Algo Atlas.

## Development

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn algo_atlas.main:app --host 127.0.0.1 --port 8000 --reload
npm run dev
```

The Vite development UI runs at <http://127.0.0.1:5173/> and proxies `/api` to FastAPI. Production uses a single FastAPI origin at port 8000.

## Storage and recovery

- `.local/algo_atlas.db` is the ignored SQLite source of truth.
- `.local/backups/` retains the latest 14 pre-export or pre-restore snapshots.
- `exports/<main>/<sub>/<slug>/README.md` stores metadata and structured notes.
- Each exported problem includes a standalone `solution.py`.
- `exports/catalog.json` contains stable IDs, taxonomy definitions, schema version, and content hashes.

The restore action is previewed before it writes and creates a database backup first. The taxonomy uses stable deterministic IDs, so an export can rebuild a fresh database without reclassification.

## Quality checks

```powershell
npm run build
.\.venv\Scripts\python.exe -m pytest
```

The application intentionally does not include accounts, cloud storage, Python execution, test harnesses, spaced repetition, browser extensions, or scheduled pushes.
