from __future__ import annotations

import json
from datetime import datetime, timezone

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session

from algo_atlas.config import ensure_local_dirs, settings
from algo_atlas.db import engine, init_db
from algo_atlas.models import AppSetting, Problem
from algo_atlas.services.sync import reconcile_catalog

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
    """Reconcile the pulled portable catalog with this device's local database."""
    init_db(target_engine)
    with Session(target_engine) as session:
        before = session.scalar(select(func.count()).select_from(Problem)) or 0
        sync_result = reconcile_catalog(session, dry_run=False)
        problem_count = session.scalar(select(func.count()).select_from(Problem)) or 0
        marker = session.get(AppSetting, INITIAL_RESTORE_KEY)
        if not marker and sync_result["state"] != "no_export":
            marker_value = {
                "status": "reconciled",
                "problem_count": problem_count,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
            session.add(
                AppSetting(key=INITIAL_RESTORE_KEY, value=json.dumps(marker_value, sort_keys=True))
            )
            session.commit()

        if sync_result["state"] == "no_export":
            status = "waiting_for_exports"
        elif sync_result["conflicts"]:
            status = "conflicts"
        elif before == 0 and problem_count:
            status = "restored"
        elif sync_result.get("applied", 0):
            status = "updated"
        else:
            status = "preserved" if problem_count else "initialized"
        return {
            "status": status,
            "problem_count": problem_count,
            "restored": sync_result.get("applied", 0) if before == 0 else 0,
            "conflicts": len(sync_result["conflicts"]),
        }


def prepare_local_state(target_engine: Engine = engine, *, run_migrations: bool = True) -> dict:
    if run_migrations:
        migrate_database()
    return initialize_from_exports(target_engine)


def main() -> None:
    print(json.dumps(prepare_local_state(), sort_keys=True))


if __name__ == "__main__":
    main()
