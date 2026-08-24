from __future__ import annotations

import re
import subprocess
from datetime import datetime

from .config import settings


def _git(*args: str, timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=settings.root_dir, capture_output=True, text=True, timeout=timeout, check=False)


def _value(*args: str) -> str:
    result = _git(*args)
    return result.stdout.strip() if result.returncode == 0 else ""


def configure_git(remote_url: str | None, branch: str, user_name: str | None, user_email: str | None) -> dict:
    if remote_url:
        if not re.match(r"^(https://github\.com/[^\s]+|git@github\.com:[^\s]+)$", remote_url):
            raise ValueError("Only GitHub HTTPS or SSH repository URLs are accepted.")
        existing = _value("remote", "get-url", "origin")
        result = _git("remote", "set-url" if existing else "add", "origin", remote_url)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "Could not configure the Git remote.")
    if user_name:
        _git("config", "user.name", user_name)
    if user_email:
        _git("config", "user.email", user_email)
    _git("config", "algoatlas.branch", branch)
    return git_state(fetch=False)


def git_state(fetch: bool = False) -> dict:
    remote = _value("remote", "get-url", "origin")
    branch = _value("config", "--get", "algoatlas.branch") or _value("branch", "--show-current") or "main"
    name = _value("config", "user.name")
    email = _value("config", "user.email")
    warnings: list[str] = []
    fetch_error = ""
    if not remote:
        warnings.append("Connect a private GitHub repository before publishing.")
    if not name or not email:
        warnings.append("Configure your Git name and email before publishing.")
    if fetch and remote:
        fetched = _git("fetch", "--quiet", "origin", timeout=45)
        if fetched.returncode != 0:
            fetch_error = fetched.stderr.strip() or "Could not reach the GitHub remote."
            warnings.append(fetch_error)
    has_head = _git("rev-parse", "--verify", "HEAD").returncode == 0
    remote_ref = f"origin/{branch}"
    has_remote_branch = _git("rev-parse", "--verify", remote_ref).returncode == 0
    ahead = behind = 0
    if has_head and has_remote_branch:
        divergence = _value("rev-list", "--left-right", "--count", f"HEAD...{remote_ref}").split()
        if len(divergence) == 2:
            ahead, behind = map(int, divergence)
        if behind:
            warnings.append("The remote branch has unseen commits. Pull and resolve them before publishing.")
    return {"remote": remote, "branch": branch, "user_name": name, "user_email": email, "ahead": ahead, "behind": behind, "warnings": warnings, "fetch_error": fetch_error}


def _changes() -> list[dict]:
    result = _git("status", "--porcelain", "--untracked-files=all", "--", "exports")
    changes = []
    for line in result.stdout.splitlines():
        if len(line) >= 4:
            code, path = line[:2].strip() or "?", line[3:]
            changes.append({"code": code, "path": path, "kind": "added" if "?" in code or "A" in code else "deleted" if "D" in code else "updated"})
    return changes


def preview_git(fetch: bool = True) -> dict:
    state = git_state(fetch=fetch)
    changes = _changes()
    changed_readmes = [item for item in changes if item["path"].endswith("README.md")]
    added = sum(1 for item in changed_readmes if item["kind"] == "added")
    updated = sum(1 for item in changed_readmes if item["kind"] == "updated")
    deleted = sum(1 for item in changed_readmes if item["kind"] == "deleted")
    today = datetime.now().strftime("%Y-%m-%d")
    state.update({
        "changes": changes, "additions": added, "updates": updated, "deletions": deleted,
        "proposed_commit": f"algos: {today} (+{added} ~{updated})", "ready": bool(changes) and not state["warnings"],
    })
    return state


def publish_git() -> dict:
    preview = preview_git(fetch=True)
    if preview["warnings"]:
        raise RuntimeError(" ".join(preview["warnings"]))
    if not preview["changes"]:
        return {**preview, "status": "no_changes"}
    staged = _git("add", "-A", "--", "exports")
    if staged.returncode != 0:
        raise RuntimeError(staged.stderr.strip() or "Could not stage the export.")
    committed = _git("commit", "-m", preview["proposed_commit"])
    if committed.returncode != 0:
        raise RuntimeError(committed.stderr.strip() or "Could not create the export commit.")
    pushed = _git("push", "-u", "origin", f"HEAD:{preview['branch']}", timeout=60)
    if pushed.returncode != 0:
        raise RuntimeError(f"The local commit was preserved, but GitHub rejected the push: {pushed.stderr.strip()}")
    return {**preview, "status": "published", "commit": _value("rev-parse", "--short", "HEAD")}
