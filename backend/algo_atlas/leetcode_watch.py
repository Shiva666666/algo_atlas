"""CLI for local setup, daily collection and agent-authored brief publication."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

import httpx

from algo_atlas.config import settings
from algo_atlas.integrations.leetcode_submissions import LeetCodeSubmissions, WatchError
from algo_atlas.integrations.leetcode_watch_files import read_json, watch_lock, write_json
from algo_atlas.services.leetcode_watch import IST, check, finalize, load_state


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("setup", "check", "status", "finalize"))
    parser.add_argument("--database", type=Path, default=settings.database_path)
    parser.add_argument("--directory", type=Path, default=settings.local_dir / "leetcode-watch")
    parser.add_argument("--draft", type=Path)
    args = parser.parse_args(argv)
    directory = args.directory.resolve()
    try:
        with watch_lock(directory):
            now = datetime.now(IST)
            today = now.date()
            if args.command == "setup":
                session = input("LEETCODE_SESSION (visible, stored locally): ").strip()
                csrf = input("csrftoken (visible, stored locally): ").strip()
                if not session or not csrf or any(value in session + csrf for value in "\r\n;"):
                    raise WatchError(
                        "Enter nonempty cookie values without cookie names or separators."
                    )
                with httpx.Client() as client:
                    account = LeetCodeSubmissions(client, session, csrf).account()
                state = load_state(directory)
                if state and state.account != account:
                    raise WatchError(
                        "LeetCode account differs from the watcher account. Credentials preserved."
                    )
                write_json(directory / "credentials.json", {"session": session, "csrf": csrf})
                result = {
                    "status": "credentials_ready",
                    "message": "Run check before activating the heartbeat.",
                }
            elif args.command == "status":
                state = load_state(directory)
                result = {
                    "status": "configured" if state else "setup_required",
                    "credentials_present": (directory / "credentials.json").exists(),
                    "last_check": state.last_check.isoformat() if state else None,
                    "next_plan": state.next_plan.isoformat() if state else None,
                    "queued_problems": len(state.pending) if state else 0,
                    "report": state.last_report if state else None,
                }
            elif args.command == "finalize":
                if args.draft is None:
                    raise WatchError("Finalize requires --draft pointing to the local draft JSON.")
                result = finalize(args.database, directory, args.draft, today)
            else:
                credentials = read_json(directory / "credentials.json")
                if not all(isinstance(credentials.get(key), str) for key in ("session", "csrf")):
                    raise WatchError("Local credentials are invalid. Run setup.")
                with httpx.Client() as client:
                    api = LeetCodeSubmissions(client, credentials["session"], credentials["csrf"])
                    result = check(api, args.database, directory, today, now=now)
        print(json.dumps(result))
        return 0
    except WatchError as error:
        print(json.dumps({"status": "action_required", "message": str(error)}))
        return 1
    except (OSError, EOFError, KeyboardInterrupt):
        print(
            json.dumps(
                {
                    "status": "action_required",
                    "message": "Local watcher operation did not complete. Retry locally.",
                }
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
