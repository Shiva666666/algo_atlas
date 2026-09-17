from __future__ import annotations

from sqlalchemy.orm import Session

from algo_atlas.config import settings
from algo_atlas.integrations.exports import ExportValidationError
from algo_atlas.models import AppSetting
from algo_atlas.services.sync.catalog import _incoming_records
from algo_atlas.services.sync.comparison import _conflict, _review_version
from algo_atlas.services.sync.records import _fingerprint, _local_records
from algo_atlas.services.sync.state import (
    _MISSING,
    BASELINE_KEY,
    LAST_RESULT_KEY,
    LEGACY_MARKER_KEY,
    _json_setting,
)


def analyze(session: Session, settings) -> dict:
    last_result = _json_setting(session, LAST_RESULT_KEY, {}) or None
    catalog_path = settings.export_dir / "catalog.json"
    if not catalog_path.is_file():
        return {
            "available": False,
            "state": "no_export",
            "creates": 0,
            "updates": 0,
            "local_changes": 0,
            "conflicts": [],
            "review_version": None,
            "validation_error": None,
            "last_result": last_result,
            "_actions": [],
            "_catalog": None,
            "_incoming": {},
            "_local": _local_records(session),
            "_baseline": {"records": {}, "accepted_local_deletions": {}},
            "_legacy": False,
        }
    try:
        catalog, incoming = _incoming_records(settings)
    except (KeyError, OSError, TypeError, ValueError, ExportValidationError) as exc:
        return {
            "available": True,
            "state": "invalid",
            "creates": 0,
            "updates": 0,
            "local_changes": 0,
            "conflicts": [],
            "review_version": None,
            "validation_error": str(exc),
            "last_result": last_result,
            "_actions": [],
            "_catalog": None,
            "_incoming": {},
            "_local": _local_records(session),
            "_baseline": {"records": {}, "accepted_local_deletions": {}},
            "_legacy": False,
        }

    local = _local_records(session)
    baseline_setting = session.get(AppSetting, BASELINE_KEY)
    baseline = _json_setting(session, BASELINE_KEY, {"records": {}, "accepted_local_deletions": {}})
    baseline_records = baseline.get("records") if isinstance(baseline.get("records"), dict) else {}
    accepted_deletions = (
        baseline.get("accepted_local_deletions")
        if isinstance(baseline.get("accepted_local_deletions"), dict)
        else {}
    )
    legacy = baseline_setting is None and (
        bool(local) or session.get(AppSetting, LEGACY_MARKER_KEY) is not None
    )
    local_identity = {
        (record["source"], record["source_key"]): problem_id for problem_id, record in local.items()
    }

    actions: list[dict] = []
    conflicts: list[dict] = []
    local_changes = 0
    handled_incoming: set[str] = set()

    for problem_id, incoming_record in incoming.items():
        related_id = local_identity.get((incoming_record["source"], incoming_record["source_key"]))
        if related_id and related_id != problem_id:
            incoming_fp = _fingerprint(incoming_record)
            if accepted_deletions.get(problem_id) == incoming_fp:
                handled_incoming.add(problem_id)
                continue
            conflicts.append(
                _conflict(
                    problem_id,
                    "identity_conflict",
                    local[related_id],
                    incoming_record,
                    related_local_id=related_id,
                )
            )
            handled_incoming.add(problem_id)

    for problem_id in sorted(set(local) | set(incoming) | set(baseline_records)):
        local_record = local.get(problem_id)
        incoming_record = incoming.get(problem_id)
        local_fp = _fingerprint(local_record) if local_record else None
        incoming_fp = _fingerprint(incoming_record) if incoming_record else None

        if problem_id in handled_incoming:
            continue
        base = baseline_records.get(problem_id, _MISSING)
        if base is _MISSING:
            if local_record and incoming_record:
                if local_fp == incoming_fp:
                    actions.append(
                        {"action": "baseline", "id": problem_id, "fingerprint": incoming_fp}
                    )
                else:
                    conflicts.append(
                        _conflict(problem_id, "legacy_diverged", local_record, incoming_record)
                    )
            elif incoming_record:
                if legacy:
                    conflicts.append(
                        _conflict(problem_id, "legacy_missing_local", None, incoming_record)
                    )
                else:
                    actions.append(
                        {"action": "create", "id": problem_id, "fingerprint": incoming_fp}
                    )
            elif local_record:
                local_changes += 1
            continue

        if base is None:
            if local_record and incoming_record:
                if local_fp == incoming_fp:
                    actions.append(
                        {"action": "baseline", "id": problem_id, "fingerprint": incoming_fp}
                    )
                else:
                    conflicts.append(
                        _conflict(problem_id, "both_changed", local_record, incoming_record)
                    )
            elif incoming_record:
                actions.append({"action": "create", "id": problem_id, "fingerprint": incoming_fp})
            elif local_record:
                local_changes += 1
            continue

        if not local_record and not incoming_record:
            actions.append({"action": "baseline", "id": problem_id, "fingerprint": None})
        elif not local_record:
            if accepted_deletions.get(problem_id) == incoming_fp:
                local_changes += 1
            else:
                conflicts.append(_conflict(problem_id, "local_deleted", None, incoming_record))
        elif not incoming_record:
            conflicts.append(_conflict(problem_id, "incoming_deleted", local_record, None))
        else:
            local_changed = local_fp != base
            incoming_changed = incoming_fp != base
            if not local_changed and incoming_changed:
                actions.append({"action": "update", "id": problem_id, "fingerprint": incoming_fp})
            elif local_changed and not incoming_changed:
                local_changes += 1
            elif local_changed and incoming_changed:
                if local_fp == incoming_fp:
                    actions.append(
                        {"action": "baseline", "id": problem_id, "fingerprint": incoming_fp}
                    )
                else:
                    conflicts.append(
                        _conflict(problem_id, "both_changed", local_record, incoming_record)
                    )

    creates = sum(action["action"] == "create" for action in actions)
    updates = sum(action["action"] == "update" for action in actions)
    state = "conflicts" if conflicts else "changes_available" if creates or updates else "clean"
    return {
        "available": True,
        "state": state,
        "creates": creates,
        "updates": updates,
        "local_changes": local_changes,
        "conflicts": conflicts,
        "review_version": _review_version(conflicts),
        "validation_error": None,
        "last_result": last_result,
        "_actions": actions,
        "_catalog": catalog,
        "_incoming": incoming,
        "_local": local,
        "_baseline": {
            "records": dict(baseline_records),
            "accepted_local_deletions": dict(accepted_deletions),
        },
        "_legacy": legacy,
    }
