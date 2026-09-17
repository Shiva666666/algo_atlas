from __future__ import annotations

import hashlib
import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from algo_atlas.models import Problem
from algo_atlas.persistence.problems import load_problem
from algo_atlas.serializers import problem_to_dict


def _iso(value: object) -> str:
    if isinstance(value, datetime):
        return value.isoformat() + ("Z" if value.tzinfo is None else "")
    return str(value or "")


def _solution(value: str) -> str:
    normalized = value.replace("\r\n", "\n").replace("\r", "\n")
    return (
        normalized.rstrip() + "\n" if normalized.strip() else "# Add your Python solution here.\n"
    )


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
        events.append(
            {
                "id": event["id"],
                "occurred_at": _iso(event["occurred_at"]),
                "observation": event.get("observation", ""),
                "reason_ids": sorted(set(reason_ids)),
            }
        )
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
