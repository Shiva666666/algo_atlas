from __future__ import annotations

import json
from contextlib import contextmanager
from threading import Lock
from typing import Iterator

from sqlalchemy.orm import Session

from algo_atlas.models import AppSetting

BASELINE_KEY = "export_sync_baseline_v1"


LAST_RESULT_KEY = "export_sync_last_result_v1"


LEGACY_MARKER_KEY = "initial_export_restore_v1"


_MISSING = object()


_SYNC_LOCK = Lock()


FIELD_LABELS = {
    "title": "title",
    "url": "source URL",
    "difficulty": "difficulty",
    "status": "learning status",
    "primary_subtag_id": "primary classification",
    "taxonomy_ids": "techniques",
    "python_code": "Python solution",
    "time_complexity": "time complexity",
    "space_complexity": "space complexity",
    "notes": "learning notes",
    "mistake_events": "mistake history",
}


class SyncBusyError(RuntimeError):
    pass


class SyncBlockedError(RuntimeError):
    pass


@contextmanager
def sync_operation() -> Iterator[None]:
    if not _SYNC_LOCK.acquire(blocking=False):
        raise SyncBusyError(
            "Another import or export is already running. Wait for it to finish, then retry."
        )
    try:
        yield
    finally:
        _SYNC_LOCK.release()


def _json_setting(session: Session, key: str, default: dict) -> dict:
    setting = session.get(AppSetting, key)
    if not setting:
        return default
    try:
        value = json.loads(setting.value)
    except (TypeError, json.JSONDecodeError):
        return default
    return value if isinstance(value, dict) else default


def _write_setting(session: Session, key: str, value: dict) -> None:
    session.merge(AppSetting(key=key, value=json.dumps(value, ensure_ascii=False, sort_keys=True)))
