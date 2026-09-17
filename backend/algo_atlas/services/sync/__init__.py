from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from algo_atlas.config import settings
from algo_atlas.integrations.exports import create_backup, export_catalog
from algo_atlas.services.sync.apply import _apply_plan, _record_export_baseline
from algo_atlas.services.sync.planning import analyze
from algo_atlas.services.sync.state import (
    LAST_RESULT_KEY,
    SyncBlockedError,
    _write_setting,
    sync_operation,
)

from .state import SyncBusyError as SyncBusyError


def _public(status: dict) -> dict:
    return {key: value for key, value in status.items() if not key.startswith("_")}


def inspect_sync(session: Session) -> dict:
    with sync_operation():
        return _public(_analyze(session))


def _create_backup_or_block() -> Path | None:
    try:
        return create_backup()
    except OSError as exc:
        raise SyncBlockedError(f"Could not create the required local backup: {exc}") from exc


def reconcile_catalog(
    session: Session,
    *,
    dry_run: bool = True,
    decisions: dict[str, Literal["keep_local", "use_incoming"]] | None = None,
    review_version: str | None = None,
) -> dict:
    decisions = decisions or {}
    with sync_operation():
        status = _analyze(session)
        if dry_run:
            return _public(status)
        if status["state"] == "no_export":
            return {**_public(status), "applied": 0, "resolved": 0}
        if status["validation_error"]:
            raise SyncBlockedError(f"The pulled export is invalid: {status['validation_error']}")
        conflict_ids = {item["id"] for item in status["conflicts"]}
        unknown = sorted(set(decisions) - conflict_ids)
        if unknown:
            raise SyncBlockedError(
                "The review contains problems that are no longer conflicted. Check again before applying it."
            )
        if decisions and review_version != status["review_version"]:
            raise SyncBlockedError(
                "The local database or pulled export changed during review. Check conflicts again."
            )
        if decisions and set(decisions) != conflict_ids:
            raise SyncBlockedError(
                "Choose a version for every conflict before applying the review."
            )
        if status.get("_legacy") and status["conflicts"] and not decisions:
            return {**_public(status), "applied": 0, "resolved": 0}
        content_actions = (
            status["creates"]
            + status["updates"]
            + sum(
                conflict["id"] in decisions and decisions[conflict["id"]] == "use_incoming"
                for conflict in status["conflicts"]
            )
        )
        if content_actions:
            _create_backup_or_block()
        try:
            applied = _apply_plan(session, status, decisions)
            result_summary = {
                **applied,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "message": "Pulled algorithm changes were applied safely."
                if applied["applied"]
                else "Sync baseline checked; no algorithm data changed.",
            }
            _write_setting(session, LAST_RESULT_KEY, result_summary)
            session.commit()
        except (OSError, RuntimeError, SQLAlchemyError) as exc:
            session.rollback()
            raise SyncBlockedError(
                f"Could not apply the reviewed algorithm changes: {exc}"
            ) from exc
        refreshed = _analyze(session)
        response = _public(refreshed)
        response.update(applied)
        return response


def prepare_export(session: Session) -> dict:
    """Reconcile pulled data, then export without overwriting unresolved work."""
    with sync_operation():
        status = _analyze(session)
        if status["validation_error"]:
            raise SyncBlockedError(
                f"Publishing is blocked because the pulled export is invalid: {status['validation_error']}"
            )
        if status["conflicts"]:
            raise SyncBlockedError(
                f"Publishing is blocked by {len(status['conflicts'])} sync conflict(s). Review them in Settings & Sync first."
            )
        backup = _create_backup_or_block()
        try:
            _apply_plan(session, status, {})
            catalog = export_catalog(session)
            _record_export_baseline(session)
            _write_setting(
                session,
                LAST_RESULT_KEY,
                {
                    "applied": status["creates"] + status["updates"],
                    "resolved": 0,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "message": f"Prepared {catalog['record_count']} algorithms for GitHub.",
                },
            )
            session.commit()
        except (OSError, RuntimeError, SQLAlchemyError) as exc:
            session.rollback()
            raise SyncBlockedError(f"Could not prepare the algorithm export: {exc}") from exc
        return {
            "catalog": catalog,
            "sync": _public(_analyze(session)),
            "backup": backup.name if backup else None,
        }


def _analyze(session: Session) -> dict:
    return analyze(session, settings)
