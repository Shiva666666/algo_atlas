from __future__ import annotations

import socket
from pathlib import Path

from algo_atlas import launcher


def write(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


def test_content_fingerprints_detect_changes_and_deleted_sources(tmp_path, monkeypatch):
    root = tmp_path / "repo"
    local = root / ".local"
    write(root / "package.json", '{"name":"atlas"}')
    write(root / "package-lock.json", '{"lockfileVersion":3}')
    write(root / "node_modules" / ".package-lock.json", "{}")
    write(root / "index.html", "<main></main>")
    write(root / "src" / "main.tsx", "export const version = 1")
    write(root / "dist" / "index.html", "built")
    monkeypatch.setattr(launcher, "_node_version", lambda: "v22.13.0")

    assert launcher.dependency_is_stale(root, local)
    launcher.mark_dependencies(root, local)
    assert not launcher.dependency_is_stale(root, local)

    assert launcher.frontend_is_stale(root, local)
    launcher.mark_frontend(root, local)
    assert not launcher.frontend_is_stale(root, local)

    (root / "src" / "main.tsx").unlink()
    assert launcher.frontend_is_stale(root, local)
    launcher.mark_frontend(root, local)
    write(root / "src" / "new.tsx", "export const version = 2")
    assert launcher.frontend_is_stale(root, local)

    write(root / "package-lock.json", '{"lockfileVersion":3,"changed":true}')
    assert launcher.dependency_is_stale(root, local)


def test_missing_build_or_install_is_always_stale(tmp_path, monkeypatch):
    monkeypatch.setattr(launcher, "_node_version", lambda: "v22.13.0")
    assert launcher.dependency_is_stale(tmp_path, tmp_path / ".local")
    assert launcher.frontend_is_stale(tmp_path, tmp_path / ".local")


def test_port_check_rejects_an_unrelated_listener():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        listener.listen()
        port = listener.getsockname()[1]
        assert not launcher.port_is_free(port)
    assert launcher.port_is_free(port)
