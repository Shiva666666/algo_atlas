from __future__ import annotations

import argparse
import hashlib
import json
import os
import socket
import subprocess
import urllib.request
from pathlib import Path

from .config import settings

FRONTEND_FILES = (
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "index.html",
)
FRONTEND_DIRS = ("src", "public", "server")


def _node_version() -> str:
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, check=False, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return "unavailable"
    return result.stdout.strip() if result.returncode == 0 else "unavailable"


def _hash_paths(root: Path, files: tuple[str, ...], directories: tuple[str, ...] = ()) -> str:
    digest = hashlib.sha256()
    paths = [root / relative for relative in files if (root / relative).is_file()]
    for directory_name in directories:
        directory = root / directory_name
        if directory.is_dir():
            paths.extend(path for path in directory.rglob("*") if path.is_file())
    for path in sorted(paths, key=lambda item: item.relative_to(root).as_posix()):
        relative = path.relative_to(root).as_posix().encode("utf-8")
        digest.update(len(relative).to_bytes(4, "big"))
        digest.update(relative)
        content = path.read_bytes()
        digest.update(len(content).to_bytes(8, "big"))
        digest.update(content)
    return digest.hexdigest()


def dependency_fingerprint(root: Path = settings.root_dir) -> str:
    digest = hashlib.sha256()
    digest.update(_hash_paths(root, ("package.json", "package-lock.json")).encode("ascii"))
    digest.update(_node_version().encode("utf-8"))
    return digest.hexdigest()


def frontend_fingerprint(root: Path = settings.root_dir) -> str:
    digest = hashlib.sha256()
    digest.update(_hash_paths(root, FRONTEND_FILES, FRONTEND_DIRS).encode("ascii"))
    digest.update(dependency_fingerprint(root).encode("ascii"))
    return digest.hexdigest()


def _read_marker(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def _write_marker(path: Path, fingerprint: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"fingerprint": fingerprint}, sort_keys=True) + "\n"
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(payload, encoding="utf-8", newline="\n")
    os.replace(temporary, path)


def dependency_is_stale(root: Path = settings.root_dir, local_dir: Path = settings.local_dir) -> bool:
    installed_lock = root / "node_modules" / ".package-lock.json"
    marker = _read_marker(local_dir / "npm-install.json")
    return not installed_lock.is_file() or marker.get("fingerprint") != dependency_fingerprint(root)


def frontend_is_stale(root: Path = settings.root_dir, local_dir: Path = settings.local_dir) -> bool:
    marker = _read_marker(local_dir / "frontend-build.json")
    return not (root / "dist" / "index.html").is_file() or marker.get("fingerprint") != frontend_fingerprint(root)


def mark_dependencies(root: Path = settings.root_dir, local_dir: Path = settings.local_dir) -> str:
    fingerprint = dependency_fingerprint(root)
    _write_marker(local_dir / "npm-install.json", fingerprint)
    return fingerprint


def mark_frontend(root: Path = settings.root_dir, local_dir: Path = settings.local_dir) -> str:
    fingerprint = frontend_fingerprint(root)
    _write_marker(local_dir / "frontend-build.json", fingerprint)
    return fingerprint


def port_is_free(port: int = 8000) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        try:
            listener.bind(("127.0.0.1", port))
        except OSError:
            return False
    return True


def health_is_ready(url: str = "http://127.0.0.1:8000/api/health") -> bool:
    try:
        with urllib.request.urlopen(url, timeout=1) as response:
            return response.status == 200
    except Exception:
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Shared startup checks for Algo Atlas.")
    parser.add_argument(
        "command",
        choices=("dependency-status", "mark-dependencies", "frontend-status", "mark-frontend", "port-status", "health-status"),
    )
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    if args.command == "dependency-status":
        print("stale" if dependency_is_stale() else "current")
    elif args.command == "mark-dependencies":
        print(mark_dependencies())
    elif args.command == "frontend-status":
        print("stale" if frontend_is_stale() else "current")
    elif args.command == "mark-frontend":
        print(mark_frontend())
    elif args.command == "port-status":
        print("free" if port_is_free(args.port) else "occupied")
    else:
        print("ready" if health_is_ready() else "unavailable")


if __name__ == "__main__":
    main()
