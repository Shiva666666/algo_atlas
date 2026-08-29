from __future__ import annotations

import subprocess
from dataclasses import replace
from pathlib import Path

from algo_atlas import git_service
from algo_atlas.config import settings as default_settings


def git(repository: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repository,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    return result.stdout.strip()


def configure_repository(tmp_path: Path, monkeypatch, *, push_initial: bool = True) -> tuple[Path, Path]:
    repository = tmp_path / "repository"
    remote = tmp_path / "remote.git"
    repository.mkdir()
    git(repository, "init", "-b", "work")
    git(repository, "config", "user.name", "Algo Atlas Test")
    git(repository, "config", "user.email", "algo-atlas@example.com")
    git(repository, "config", "algoatlas.branch", "main")
    git(repository, "init", "--bare", str(remote))
    git(repository, "remote", "add", "origin", str(remote))
    (repository / "exports").mkdir()
    (repository / "exports" / "catalog.json").write_text('{"record_count": 1}\n', encoding="utf-8")
    (repository / "application.txt").write_text("initial\n", encoding="utf-8")
    git(repository, "add", "exports", "application.txt")
    git(repository, "commit", "-m", "Initial state")
    if push_initial:
        git(repository, "push", "-u", "origin", "HEAD:main")

    local_settings = replace(
        default_settings,
        root_dir=repository,
        local_dir=repository / ".local",
        database_path=repository / ".local" / "test.db",
        backup_dir=repository / ".local" / "backups",
        export_dir=repository / "exports",
        frontend_dist=repository / "dist",
    )
    monkeypatch.setattr(git_service, "settings", local_settings)
    return repository, remote


def test_publish_pushes_clean_commits_that_are_already_ahead(tmp_path, monkeypatch):
    repository, remote = configure_repository(tmp_path, monkeypatch)
    (repository / "exports" / "catalog.json").write_text('{"record_count": 2}\n', encoding="utf-8")
    git(repository, "add", "exports")
    git(repository, "commit", "-m", "Pending export")

    result = git_service.publish_git()

    assert result["status"] == "published"
    assert git(repository, "rev-parse", "HEAD") == git(remote, "rev-parse", "refs/heads/main")


def test_publish_creates_missing_remote_branch_for_clean_repository(tmp_path, monkeypatch):
    repository, remote = configure_repository(tmp_path, monkeypatch, push_initial=False)

    result = git_service.publish_git()

    assert result["status"] == "published"
    assert git(repository, "rev-parse", "HEAD") == git(remote, "rev-parse", "refs/heads/main")


def test_publish_commit_excludes_unrelated_staged_files(tmp_path, monkeypatch):
    repository, remote = configure_repository(tmp_path, monkeypatch)
    (repository / "application.txt").write_text("staged but private\n", encoding="utf-8")
    git(repository, "add", "application.txt")
    (repository / "exports" / "catalog.json").write_text('{"record_count": 2}\n', encoding="utf-8")
    new_export = repository / "exports" / "new-problem" / "README.md"
    new_export.parent.mkdir()
    new_export.write_text("# New problem\n", encoding="utf-8")

    result = git_service.publish_git()

    assert result["status"] == "published"
    assert git(repository, "show", "--format=", "--name-only", "HEAD").splitlines() == [
        "exports/catalog.json",
        "exports/new-problem/README.md",
    ]
    assert git(repository, "diff", "--cached", "--name-only").splitlines() == ["application.txt"]
    assert git(remote, "show", "main:application.txt") == "initial"
