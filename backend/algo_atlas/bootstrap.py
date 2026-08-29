from __future__ import annotations

import json
from datetime import datetime, timezone

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session

from .config import ensure_local_dirs, settings
from .db import engine, init_db
from .export_service import restore_catalog, validate_export_catalog
from .models import AppSetting, Problem

INITIAL_RESTORE_KEY = "initial_export_restore_v1"


def _alembic_config() -> Config:
    config = Config(str(settings.root_dir / "alembic.ini"))
    config.set_main_option("script_location", str(settings.root_dir / "backend" / "alembic"))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{settings.database_path.as_posix()}")
    return config


def migrate_database() -> None:
    ensure_local_dirs()
    command.upgrade(_alembic_config(), "head")


def initialize_from_exports(target_engine: Engine = engine) -> dict:
    """Restore a portable catalog exactly once for an empty local database."""
    init_db(target_engine)
    with Session(target_engine) as session:
        marker = session.get(AppSetting, INITIAL_RESTORE_KEY)
        problem_count = session.scalar(select(func.count()).select_from(Problem)) or 0
        if marker:
            return {"status": "initialized", "problem_count": problem_count, "restored": 0}
        if problem_count:
            marker_value = {
                "status": "existing_database",
                "problem_count": problem_count,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
            session.add(AppSetting(key=INITIAL_RESTORE_KEY, value=json.dumps(marker_value, sort_keys=True)))
            session.commit()
            return {"status": "preserved", "problem_count": problem_count, "restored": 0}
        catalog_path = settings.export_dir / "catalog.json"
        if not catalog_path.is_file():
            return {"status": "waiting_for_exports", "problem_count": 0, "restored": 0}
        catalog = validate_export_catalog()
        restore_result = restore_catalog(session, dry_run=False, commit=False)
        restored_count = session.scalar(select(func.count()).select_from(Problem)) or 0
        expected_count = catalog["record_count"]
        if restored_count != expected_count:
            session.rollback()
            raise RuntimeError(f"Export restore produced {restored_count} problems; expected {expected_count}.")
        marker_value = {
            "status": "restored",
            "problem_count": restored_count,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        session.merge(AppSetting(key=INITIAL_RESTORE_KEY, value=json.dumps(marker_value, sort_keys=True)))
        session.commit()
        return {
            "status": "restored",
            "problem_count": restored_count,
            "restored": restore_result["creates"],
        }


def prepare_local_state(target_engine: Engine = engine, *, run_migrations: bool = True) -> dict:
    if run_migrations:
        migrate_database()
    return initialize_from_exports(target_engine)


def main() -> None:
    print(json.dumps(prepare_local_state(), sort_keys=True))


if __name__ == "__main__":
    main()
