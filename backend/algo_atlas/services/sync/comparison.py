from __future__ import annotations

import hashlib
import json

from algo_atlas.services.sync.records import _fingerprint

from .state import FIELD_LABELS


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
        return [
            {
                "field": "whole_problem",
                "label": "whole problem",
                "local": local["title"] if local else "Deleted or missing",
                "incoming": incoming["title"] if incoming else "Deleted or missing",
            }
        ]
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
