from __future__ import annotations

import json
import shutil
from dataclasses import replace

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from algo_atlas import bootstrap, export_service
from algo_atlas.bootstrap import INITIAL_RESTORE_KEY, prepare_local_state
from algo_atlas.config import settings as default_settings
from algo_atlas.db import build_engine, init_db
from algo_atlas.export_service import ExportValidationError, restore_catalog
from algo_atlas.models import AppSetting, Problem


@pytest.fixture()
def bootstrap_environment(tmp_path, monkeypatch):
    local_dir = tmp_path / ".local"
    local_dir.mkdir()
    export_dir = tmp_path / "exports"
    shutil.copytree(default_settings.export_dir, export_dir)
    local_settings = replace(
        default_settings,
        root_dir=tmp_path,
        local_dir=local_dir,
        database_path=local_dir / "algo_atlas.db",
        backup_dir=local_dir / "backups",
        export_dir=export_dir,
        frontend_dist=tmp_path / "dist",
    )
    monkeypatch.setattr(bootstrap, "settings", local_settings)
    monkeypatch.setattr(export_service, "settings", local_settings)
    target_engine = build_engine(f"sqlite:///{local_settings.database_path.as_posix()}")
    yield local_settings, target_engine
    target_engine.dispose()


def problem_count(session: Session) -> int:
    return session.scalar(select(func.count()).select_from(Problem)) or 0


def test_fresh_database_restores_the_tracked_catalog(bootstrap_environment):
    local_settings, target_engine = bootstrap_environment
    expected = json.loads((local_settings.export_dir / "catalog.json").read_text(encoding="utf-8"))["record_count"]
    result = prepare_local_state(target_engine, run_migrations=False)
    with Session(target_engine) as session:
        assert result == {"status": "restored", "problem_count": expected, "restored": expected}
        assert problem_count(session) == expected
        assert session.get(AppSetting, INITIAL_RESTORE_KEY) is not None


def test_existing_database_is_preserved(bootstrap_environment):
    _local_settings, target_engine = bootstrap_environment
    init_db(target_engine)
    with Session(target_engine) as session:
        restore_catalog(session, dry_run=False)
        first_problem = session.scalars(select(Problem).order_by(Problem.id)).first()
        assert first_problem is not None
        first_problem.title = "Locally edited title"
        first_id = first_problem.id
        session.commit()
    result = prepare_local_state(target_engine, run_migrations=False)
    with Session(target_engine) as session:
        assert result["status"] == "preserved"
        assert session.get(Problem, first_id).title == "Locally edited title"
        assert session.get(AppSetting, INITIAL_RESTORE_KEY) is not None


def test_initialized_database_stays_empty_after_user_deletes_every_problem(bootstrap_environment):
    _local_settings, target_engine = bootstrap_environment
    prepare_local_state(target_engine, run_migrations=False)
    with Session(target_engine) as session:
        session.execute(delete(Problem))
        session.commit()
    result = prepare_local_state(target_engine, run_migrations=False)
    with Session(target_engine) as session:
        assert result == {"status": "initialized", "problem_count": 0, "restored": 0}
        assert problem_count(session) == 0


def test_missing_exports_are_retried_on_the_next_start(bootstrap_environment):
    local_settings, target_engine = bootstrap_environment
    tracked_copy = local_settings.root_dir / "tracked-copy"
    shutil.copytree(local_settings.export_dir, tracked_copy)
    shutil.rmtree(local_settings.export_dir)
    local_settings.export_dir.mkdir()
    first = prepare_local_state(target_engine, run_migrations=False)
    with Session(target_engine) as session:
        assert first["status"] == "waiting_for_exports"
        assert session.get(AppSetting, INITIAL_RESTORE_KEY) is None
    shutil.rmtree(local_settings.export_dir)
    shutil.copytree(tracked_copy, local_settings.export_dir)
    second = prepare_local_state(target_engine, run_migrations=False)
    assert second["status"] == "restored"


def test_invalid_exports_do_not_partially_initialize(bootstrap_environment):
    local_settings, target_engine = bootstrap_environment
    catalog = json.loads((local_settings.export_dir / "catalog.json").read_text(encoding="utf-8"))
    record = catalog["records"][0]
    (local_settings.export_dir / record["path"] / "solution.py").write_text("# corrupted\n", encoding="utf-8")
    with pytest.raises(ExportValidationError, match="Hash mismatch"):
        prepare_local_state(target_engine, run_migrations=False)
    with Session(target_engine) as session:
        assert problem_count(session) == 0
        assert session.get(AppSetting, INITIAL_RESTORE_KEY) is None
