from __future__ import annotations

import hashlib
import json
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Iterator, Literal

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .config import settings
from .db import delete_problem_search, load_problem, sync_problem_search
from .export_service import (
    ExportValidationError,
    _parse_markdown,
    _record_directory,
    create_backup,
    export_catalog,
    validate_export_catalog,
)
from .models import AppSetting, MistakeEvent, MistakeEventReason, NoteBullet, Problem, ProblemTaxonomy, TaxonomyNode
from .serializers import problem_to_dict

BASELINE_KEY = "export_sync_baseline_v1"
LAST_RESULT_KEY = "export_sync_last_result_v1"
LEGACY_MARKER_KEY = "initial_export_restore_v1"

_MISSING = object()
_SYNC_LOCK = Lock()


class SyncBusyError(RuntimeError):
    pass


class SyncBlockedError(RuntimeError):
    pass


@contextmanager
def sync_operation() -> Iterator[None]:
    if not _SYNC_LOCK.acquire(blocking=False):
        raise SyncBusyError("Another import or export is already running. Wait for it to finish, then retry.")
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


def _iso(value: object) -> str:
    if isinstance(value, datetime):
        return value.isoformat() + ("Z" if value.tzinfo is None else "")
    return str(value or "")


def _solution(value: str) -> str:
    normalized = value.replace("\r\n", "\n").replace("\r", "\n")
    return normalized.rstrip() + "\n" if normalized.strip() else "# Add your Python solution here.\n"


def _canonical_record(record: dict) -> dict:
    notes = {
        section: [str(item) for item in bullets]
        for section, bullets in sorted(record.get("notes", {}).items())
        if bullets
    }
    events = []
    for event in record.get("mistake_events", []):
        reason_ids = event.get("reason_ids")
        if reason_ids is None:
            reason_ids = [reason["id"] for reason in event.get("reasons", [])]
        events.append({
            "id": event["id"],
            "occurred_at": _iso(event["occurred_at"]),
            "observation": event.get("observation", ""),
            "reason_ids": sorted(set(reason_ids)),
        })
    events.sort(key=lambda item: (item["occurred_at"], item["id"]))
    taxonomy_ids = record.get("taxonomy_ids")
    if taxonomy_ids is None:
        taxonomy_ids = [node["id"] for node in record.get("taxonomy", [])]
    primary_id = record.get("primary_subtag_id")
    if primary_id is None and record.get("primary_subtag"):
        primary_id = record["primary_subtag"]["id"]
    return {
        "id": record["id"],
        "source": record["source"],
        "source_key": record["source_key"],
        "slug": record["slug"],
        "title": record["title"],
        "url": record.get("url"),
        "difficulty": record["difficulty"],
        "status": record["status"],
        "primary_subtag_id": primary_id,
        "taxonomy_ids": sorted(set(taxonomy_ids)),
        "python_code": _solution(record.get("python_code", "")),
        "time_complexity": record.get("time_complexity", ""),
        "space_complexity": record.get("space_complexity", ""),
        "notes": notes,
        "mistake_events": events,
        "created_at": _iso(record["created_at"]),
        "updated_at": _iso(record["updated_at"]),
    }


def _fingerprint(record: dict) -> str:
    content = {key: value for key, value in record.items() if key != "updated_at"}
    payload = json.dumps(content, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _local_records(session: Session) -> dict[str, dict]:
    records: dict[str, dict] = {}
    for problem_id in session.scalars(select(Problem.id).order_by(Problem.id)).all():
        problem = load_problem(session, problem_id)
        if problem:
            records[problem_id] = _canonical_record(problem_to_dict(problem))
    return records


def _incoming_records() -> tuple[dict, dict[str, dict]]:
    catalog = validate_export_catalog()
    taxonomy = catalog.get("taxonomy")
    if not isinstance(taxonomy, list):
        raise ExportValidationError("Export taxonomy must be a list.")
    taxonomy_by_id: dict[str, dict] = {}
    seen_slugs: set[str] = set()
    for index, node in enumerate(taxonomy):
        if not isinstance(node, dict):
            raise ExportValidationError(f"Export taxonomy node {index} must be an object.")
        node_id = node.get("id")
        name = node.get("name")
        slug = node.get("slug")
        kind = node.get("kind")
        aliases = node.get("aliases")
        if not isinstance(node_id, str) or not node_id or node_id in taxonomy_by_id:
            raise ExportValidationError(f"Duplicate or invalid taxonomy id: {node_id!r}.")
        if not isinstance(name, str) or not name.strip() or len(name) > 120:
            raise ExportValidationError(f"Taxonomy node {node_id} has an invalid name.")
        if not isinstance(slug, str) or not slug or len(slug) > 140 or slug in seen_slugs:
            raise ExportValidationError(f"Taxonomy node {node_id} has a duplicate or invalid slug.")
        if kind not in {"main", "sub", "pattern", "failure", "custom"}:
            raise ExportValidationError(f"Taxonomy node {node_id} has an invalid kind.")
        if not isinstance(aliases, list) or any(not isinstance(alias, str) for alias in aliases):
            raise ExportValidationError(f"Taxonomy node {node_id} has invalid aliases.")
        taxonomy_by_id[node_id] = node
        seen_slugs.add(slug)
    for node_id, node in taxonomy_by_id.items():
        parent_id = node.get("parent_id")
        if parent_id is not None and not isinstance(parent_id, str):
            raise ExportValidationError(f"Taxonomy node {node_id} has an invalid parent id.")
        if parent_id is not None and parent_id not in taxonomy_by_id:
            raise ExportValidationError(f"Taxonomy node {node_id} has an unknown parent.")
        if node["kind"] == "sub" and (parent_id is None or taxonomy_by_id[parent_id]["kind"] != "main"):
            raise ExportValidationError(f"Taxonomy sub-tag {node_id} must belong to a main family.")

    records: dict[str, dict] = {}
    seen_identities: set[tuple[str, str]] = set()
    seen_events: set[str] = set()
    for catalog_record in catalog["records"]:
        directory = _record_directory(catalog_record)
        metadata, notes = _parse_markdown(directory / "README.md")
        if not isinstance(metadata, dict):
            raise ExportValidationError(f"README metadata for {catalog_record['id']} must be an object.")
        metadata = dict(metadata)
        if not isinstance(metadata.get("taxonomy_ids"), list):
            raise ExportValidationError(f"Problem {catalog_record['id']} has invalid taxonomy links.")
        if not isinstance(metadata.get("mistake_events"), list):
            raise ExportValidationError(f"Problem {catalog_record['id']} has invalid mistake history.")
        for event in metadata["mistake_events"]:
            if not isinstance(event, dict) or not isinstance(event.get("reason_ids"), list):
                raise ExportValidationError(f"Problem {catalog_record['id']} has an invalid mistake event.")
        metadata["notes"] = notes
        metadata["python_code"] = (directory / "solution.py").read_text(encoding="utf-8")
        record = _canonical_record(metadata)
        for key, maximum in (("source", 32), ("source_key", 180), ("slug", 180), ("title", 240)):
            value = record[key]
            if not isinstance(value, str) or not value.strip() or len(value) > maximum:
                raise ExportValidationError(f"Problem {record['id']} has an invalid {key}.")
        if record["url"] is not None and (not isinstance(record["url"], str) or len(record["url"]) > 500):
            raise ExportValidationError(f"Problem {record['id']} has an invalid source URL.")
        if record["difficulty"] not in {"Easy", "Medium", "Hard"}:
            raise ExportValidationError(f"Problem {record['id']} has an invalid difficulty.")
        if record["status"] not in {"Open", "Understood", "Resolved"}:
            raise ExportValidationError(f"Problem {record['id']} has an invalid status.")
        if len(record["python_code"]) > 200_000:
            raise ExportValidationError(f"Problem {record['id']} has a solution larger than 200,000 characters.")
        if any(not isinstance(record[key], str) or len(record[key]) > 80 for key in ("time_complexity", "space_complexity")):
            raise ExportValidationError(f"Problem {record['id']} has invalid complexity metadata.")
        primary_id = record["primary_subtag_id"]
        if primary_id not in taxonomy_by_id or taxonomy_by_id[primary_id]["kind"] != "sub":
            raise ExportValidationError(f"Problem {record['id']} has an invalid primary sub-tag.")
        if any(taxonomy_id not in taxonomy_by_id for taxonomy_id in record["taxonomy_ids"]):
            raise ExportValidationError(f"Problem {record['id']} references unknown taxonomy.")
        for value, label in ((record["created_at"], "created_at"), (record["updated_at"], "updated_at")):
            try:
                _parse_datetime(value)
            except (TypeError, ValueError) as exc:
                raise ExportValidationError(f"Problem {record['id']} has an invalid {label}.") from exc
        identity = (record["source"], record["source_key"])
        if identity in seen_identities:
            raise ExportValidationError(f"Duplicate export source identity: {record['source']} / {record['source_key']}.")
        seen_identities.add(identity)
        for event in record["mistake_events"]:
            event_id = event["id"]
            if not isinstance(event_id, str) or not event_id or event_id in seen_events:
                raise ExportValidationError(f"Problem {record['id']} has a duplicate or invalid mistake event id.")
            seen_events.add(event_id)
            try:
                _parse_datetime(event["occurred_at"])
            except (TypeError, ValueError) as exc:
                raise ExportValidationError(f"Problem {record['id']} has an invalid mistake event date.") from exc
            if not isinstance(event["observation"], str) or len(event["observation"]) > 2_000:
                raise ExportValidationError(f"Problem {record['id']} has an invalid mistake observation.")
            if any(
                reason_id not in taxonomy_by_id or taxonomy_by_id[reason_id]["kind"] != "failure"
                for reason_id in event["reason_ids"]
            ):
                raise ExportValidationError(f"Problem {record['id']} has an invalid mistake reason.")
        records[catalog_record["id"]] = record
    return catalog, records


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


def _changed_fields(local: dict | None, incoming: dict | None) -> list[str]:
    if local is None or incoming is None:
        return ["whole problem"]
    return [label for key, label in FIELD_LABELS.items() if local.get(key) != incoming.get(key)]


def _display_value(key: str, value: object) -> str:
    if value is None:
        return "Not present"
    if key == "notes" and isinstance(value, dict):
        text_value = "\n".join(
            f"{section.replace('_', ' ').title()}: {'; '.join(str(item) for item in bullets)}"
            for section, bullets in value.items()
        )
    elif key == "mistake_events" and isinstance(value, list):
        text_value = "\n".join(
            f"{event.get('occurred_at', '')}: {event.get('observation') or 'No observation'}"
            for event in value
        )
    elif isinstance(value, list):
        text_value = ", ".join(str(item) for item in value) or "None"
    else:
        text_value = str(value) or "Empty"
    return text_value if len(text_value) <= 1_200 else text_value[:1_199] + "…"


def _field_comparisons(local: dict | None, incoming: dict | None) -> list[dict]:
    if local is None or incoming is None:
        return [{
            "field": "whole_problem",
            "label": "whole problem",
            "local": local["title"] if local else "Deleted or missing",
            "incoming": incoming["title"] if incoming else "Deleted or missing",
        }]
    return [
        {
            "field": key,
            "label": label,
            "local": _display_value(key, local.get(key)),
            "incoming": _display_value(key, incoming.get(key)),
        }
        for key, label in FIELD_LABELS.items()
        if local.get(key) != incoming.get(key)
    ]


def _summary(record: dict | None) -> dict | None:
    if record is None:
        return None
    return {"id": record["id"], "title": record["title"], "updated_at": record["updated_at"]}


def _review_version(conflicts: list[dict]) -> str | None:
    if not conflicts:
        return None
    stable = [
        {
            "id": item["id"],
            "kind": item["kind"],
            "local_fingerprint": item.get("local_fingerprint"),
            "incoming_fingerprint": item.get("incoming_fingerprint"),
            "related_local_id": item.get("related_local_id"),
        }
        for item in conflicts
    ]
    payload = json.dumps(stable, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _conflict(
    problem_id: str,
    kind: str,
    local: dict | None,
    incoming: dict | None,
    *,
    related_local_id: str | None = None,
) -> dict:
    messages = {
        "both_changed": "This problem changed locally and in the pulled export.",
        "incoming_deleted": "The pulled export deleted this problem.",
        "local_deleted": "This device deleted a problem that still exists in the pulled export.",
        "legacy_diverged": "This older device has a different version and no previous sync baseline.",
        "legacy_missing_local": "This older device is missing a problem from the pulled export.",
        "identity_conflict": "The same source problem exists under a different local record ID.",
    }
    return {
        "id": problem_id,
        "kind": kind,
        "summary": messages[kind],
        "changed_fields": _changed_fields(local, incoming),
        "field_comparisons": _field_comparisons(local, incoming),
        "local": _summary(local),
        "incoming": _summary(incoming),
        "local_fingerprint": _fingerprint(local) if local else None,
        "incoming_fingerprint": _fingerprint(incoming) if incoming else None,
        "related_local_id": related_local_id,
    }


def _analyze(session: Session) -> dict:
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
        catalog, incoming = _incoming_records()
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
    accepted_deletions = baseline.get("accepted_local_deletions") if isinstance(baseline.get("accepted_local_deletions"), dict) else {}
    legacy = baseline_setting is None and (bool(local) or session.get(AppSetting, LEGACY_MARKER_KEY) is not None)
    local_identity = {(record["source"], record["source_key"]): problem_id for problem_id, record in local.items()}

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
            conflicts.append(_conflict(problem_id, "identity_conflict", local[related_id], incoming_record, related_local_id=related_id))
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
                    actions.append({"action": "baseline", "id": problem_id, "fingerprint": incoming_fp})
                else:
                    conflicts.append(_conflict(problem_id, "legacy_diverged", local_record, incoming_record))
            elif incoming_record:
                if legacy:
                    conflicts.append(_conflict(problem_id, "legacy_missing_local", None, incoming_record))
                else:
                    actions.append({"action": "create", "id": problem_id, "fingerprint": incoming_fp})
            elif local_record:
                local_changes += 1
            continue

        if base is None:
            if local_record and incoming_record:
                if local_fp == incoming_fp:
                    actions.append({"action": "baseline", "id": problem_id, "fingerprint": incoming_fp})
                else:
                    conflicts.append(_conflict(problem_id, "both_changed", local_record, incoming_record))
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
                    actions.append({"action": "baseline", "id": problem_id, "fingerprint": incoming_fp})
                else:
                    conflicts.append(_conflict(problem_id, "both_changed", local_record, incoming_record))

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
        "_baseline": {"records": dict(baseline_records), "accepted_local_deletions": dict(accepted_deletions)},
        "_legacy": legacy,
    }


def _public(status: dict) -> dict:
    return {key: value for key, value in status.items() if not key.startswith("_")}


def inspect_sync(session: Session) -> dict:
    with sync_operation():
        return _public(_analyze(session))


def _ensure_custom_taxonomy(session: Session, catalog: dict) -> None:
    for node_data in catalog.get("taxonomy", []):
        if node_data.get("kind") == "custom" and not session.get(TaxonomyNode, node_data["id"]):
            session.add(TaxonomyNode(
                id=node_data["id"],
                name=node_data["name"],
                slug=node_data["slug"],
                kind="custom",
                parent_id=node_data.get("parent_id"),
                aliases_json=json.dumps(node_data.get("aliases", []), ensure_ascii=False),
                color=node_data.get("color"),
                protected=False,
                sort_order=node_data.get("sort_order", 0),
            ))
    session.flush()


def _parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


def _apply_incoming(session: Session, record: dict) -> None:
    problem = session.get(Problem, record["id"])
    if not problem:
        problem = Problem(
            id=record["id"],
            source=record["source"],
            source_key=record["source_key"],
            slug=record["slug"],
            title=record["title"],
            primary_subtag_id=record["primary_subtag_id"],
        )
        session.add(problem)
    problem.source = record["source"]
    problem.source_key = record["source_key"]
    problem.slug = record["slug"]
    problem.title = record["title"]
    problem.url = record["url"]
    problem.difficulty = record["difficulty"]
    problem.status = record["status"]
    problem.primary_subtag_id = record["primary_subtag_id"]
    problem.python_code = record["python_code"]
    problem.time_complexity = record["time_complexity"]
    problem.space_complexity = record["space_complexity"]
    problem.created_at = _parse_datetime(record["created_at"])
    problem.updated_at = _parse_datetime(record["updated_at"])
    problem.taxonomy_links.clear()
    for taxonomy_id in record["taxonomy_ids"]:
        if session.get(TaxonomyNode, taxonomy_id):
            problem.taxonomy_links.append(ProblemTaxonomy(taxonomy_id=taxonomy_id, role="pattern"))
    problem.note_bullets.clear()
    for section, bullets in record["notes"].items():
        for position, text in enumerate(bullets):
            problem.note_bullets.append(NoteBullet(section=section, position=position, text=text))
    problem.mistake_events.clear()
    for event_data in record["mistake_events"]:
        event = MistakeEvent(
            id=event_data["id"],
            occurred_at=_parse_datetime(event_data["occurred_at"]),
            observation=event_data["observation"],
        )
        for reason_id in event_data["reason_ids"]:
            if session.get(TaxonomyNode, reason_id):
                event.reason_links.append(MistakeEventReason(taxonomy_id=reason_id))
        problem.mistake_events.append(event)
    session.flush()
    sync_problem_search(session, problem)


def _delete_problem(session: Session, problem_id: str) -> None:
    problem = session.get(Problem, problem_id)
    if not problem:
        return
    delete_problem_search(session, problem_id)
    session.delete(problem)
    session.flush()


def _create_backup_or_block() -> Path | None:
    try:
        return create_backup()
    except OSError as exc:
        raise SyncBlockedError(f"Could not create the required local backup: {exc}") from exc


def _apply_plan(
    session: Session,
    status: dict,
    decisions: dict[str, Literal["keep_local", "use_incoming"]],
) -> dict:
    baseline = status["_baseline"]
    records = baseline["records"]
    accepted_deletions = baseline["accepted_local_deletions"]
    incoming = status["_incoming"]
    content_changes = 0

    if status["_catalog"]:
        _ensure_custom_taxonomy(session, status["_catalog"])

    for action in status["_actions"]:
        problem_id = action["id"]
        if action["action"] in {"create", "update"}:
            _apply_incoming(session, incoming[problem_id])
            content_changes += 1
        records[problem_id] = action["fingerprint"]
        accepted_deletions.pop(problem_id, None)

    resolved = 0
    for conflict in status["conflicts"]:
        choice = decisions.get(conflict["id"])
        if not choice:
            continue
        problem_id = conflict["id"]
        incoming_record = incoming.get(problem_id)
        incoming_fp = conflict["incoming_fingerprint"]
        if choice == "use_incoming":
            related_id = conflict.get("related_local_id")
            if related_id:
                _delete_problem(session, related_id)
                content_changes += 1
            if incoming_record:
                _apply_incoming(session, incoming_record)
                records[problem_id] = incoming_fp
                accepted_deletions.pop(problem_id, None)
            else:
                _delete_problem(session, problem_id)
                records[problem_id] = None
            content_changes += 1
        else:
            if incoming_record:
                records[problem_id] = incoming_fp
                if session.get(Problem, problem_id) is None:
                    accepted_deletions[problem_id] = incoming_fp
                else:
                    accepted_deletions.pop(problem_id, None)
            else:
                records[problem_id] = None
                accepted_deletions.pop(problem_id, None)
        resolved += 1

    _write_setting(session, BASELINE_KEY, {
        "records": records,
        "accepted_local_deletions": accepted_deletions,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"applied": content_changes, "resolved": resolved}


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
            raise SyncBlockedError("The review contains problems that are no longer conflicted. Check again before applying it.")
        if decisions and review_version != status["review_version"]:
            raise SyncBlockedError("The local database or pulled export changed during review. Check conflicts again.")
        if decisions and set(decisions) != conflict_ids:
            raise SyncBlockedError("Choose a version for every conflict before applying the review.")
        if status.get("_legacy") and status["conflicts"] and not decisions:
            return {**_public(status), "applied": 0, "resolved": 0}
        content_actions = status["creates"] + status["updates"] + sum(
            conflict["id"] in decisions and decisions[conflict["id"]] == "use_incoming"
            for conflict in status["conflicts"]
        )
        if content_actions:
            _create_backup_or_block()
        try:
            applied = _apply_plan(session, status, decisions)
            result_summary = {
                **applied,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "message": "Pulled algorithm changes were applied safely." if applied["applied"] else "Sync baseline checked; no algorithm data changed.",
            }
            _write_setting(session, LAST_RESULT_KEY, result_summary)
            session.commit()
        except (OSError, RuntimeError, SQLAlchemyError) as exc:
            session.rollback()
            raise SyncBlockedError(f"Could not apply the reviewed algorithm changes: {exc}") from exc
        refreshed = _analyze(session)
        response = _public(refreshed)
        response.update(applied)
        return response


def _record_export_baseline(session: Session) -> None:
    local = _local_records(session)
    _write_setting(session, BASELINE_KEY, {
        "records": {problem_id: _fingerprint(record) for problem_id, record in local.items()},
        "accepted_local_deletions": {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })


def prepare_export(session: Session) -> dict:
    """Reconcile pulled data, then export without overwriting unresolved work."""
    with sync_operation():
        status = _analyze(session)
        if status["validation_error"]:
            raise SyncBlockedError(f"Publishing is blocked because the pulled export is invalid: {status['validation_error']}")
        if status["conflicts"]:
            raise SyncBlockedError(
                f"Publishing is blocked by {len(status['conflicts'])} sync conflict(s). Review them in Settings & Sync first."
            )
        backup = _create_backup_or_block()
        try:
            _apply_plan(session, status, {})
            catalog = export_catalog(session)
            _record_export_baseline(session)
            _write_setting(session, LAST_RESULT_KEY, {
                "applied": status["creates"] + status["updates"],
                "resolved": 0,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "message": f"Prepared {catalog['record_count']} algorithms for GitHub.",
            })
            session.commit()
        except (OSError, RuntimeError, SQLAlchemyError) as exc:
            session.rollback()
            raise SyncBlockedError(f"Could not prepare the algorithm export: {exc}") from exc
        return {
            "catalog": catalog,
            "sync": _public(_analyze(session)),
            "backup": backup.name if backup else None,
        }
