from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from algo_atlas import export_service, git_service
from algo_atlas.config import settings as default_settings
from algo_atlas.db import build_engine, init_db
from algo_atlas.export_service import export_catalog, restore_catalog
from algo_atlas.models import Problem

from .conftest import sample_payload


def snapshot(directory: Path) -> dict[str, bytes]:
    return {path.relative_to(directory).as_posix(): path.read_bytes() for path in directory.rglob("*") if path.is_file()}


def test_export_is_deterministic_and_restorable(client, taxonomy, test_engine, tmp_path, monkeypatch):
    created = client.post("/api/problems", json=sample_payload(taxonomy))
    assert created.status_code == 201
    local_settings = replace(default_settings, root_dir=tmp_path, local_dir=tmp_path / ".local", database_path=tmp_path / "test.db", backup_dir=tmp_path / ".local" / "backups", export_dir=tmp_path / "exports", frontend_dist=tmp_path / "dist")
    local_settings.local_dir.mkdir(parents=True)
    monkeypatch.setattr(export_service, "settings", local_settings)
    monkeypatch.setattr(git_service, "settings", local_settings)

    with Session(test_engine) as session:
        first = export_catalog(session)
        first_files = snapshot(local_settings.export_dir)
        second = export_catalog(session)
        second_files = snapshot(local_settings.export_dir)
    assert first == second
    assert first_files == second_files
    assert first["record_count"] == 1
    assert any(path.endswith("solution.py") for path in first_files)

    restored_engine = build_engine(f"sqlite:///{(tmp_path / 'restored.db').as_posix()}")
    init_db(restored_engine)
    with Session(restored_engine) as restored_session:
        preview = restore_catalog(restored_session, dry_run=True)
        assert preview["creates"] == 1
        restore_catalog(restored_session, dry_run=False)
        assert restored_session.scalar(select(Problem.id)) == created.json()["id"]
        export_catalog(restored_session)
    assert snapshot(local_settings.export_dir) == first_files
    restored_engine.dispose()


def test_export_tree_sync_preserves_watched_directory(tmp_path, monkeypatch):
    local_settings = replace(
        default_settings,
        root_dir=tmp_path,
        local_dir=tmp_path / ".local",
        database_path=tmp_path / "test.db",
        backup_dir=tmp_path / ".local" / "backups",
        export_dir=tmp_path / "exports",
        frontend_dist=tmp_path / "dist",
    )
    local_settings.local_dir.mkdir(parents=True)
    local_settings.export_dir.mkdir()
    (local_settings.export_dir / "stale.txt").write_text("remove", encoding="utf-8")
    stage = local_settings.local_dir / "export-stage-test"
    (stage / "nested").mkdir(parents=True)
    with (stage / "catalog.json").open("w", encoding="utf-8", newline="") as file:
        file.write('{"record_count": 1}\n')
    with (stage / "nested" / "README.md").open("w", encoding="utf-8", newline="") as file:
        file.write("# Fresh\n")
    monkeypatch.setattr(export_service, "settings", local_settings)

    export_service._sync_export_tree_in_place(stage)

    assert local_settings.export_dir.is_dir()
    assert snapshot(local_settings.export_dir) == {
        "catalog.json": b'{"record_count": 1}\n',
        "nested/README.md": b"# Fresh\n",
    }
