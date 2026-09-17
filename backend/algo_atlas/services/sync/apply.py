from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy.orm import Session

from algo_atlas.models import (
    MistakeEvent,
    MistakeEventReason,
    NoteBullet,
    Problem,
    ProblemTaxonomy,
    TaxonomyNode,
)
from algo_atlas.persistence.problems import delete_problem_search, sync_problem_search
from algo_atlas.services.sync.records import _fingerprint, _local_records
from algo_atlas.services.sync.state import BASELINE_KEY, _write_setting


def _ensure_custom_taxonomy(session: Session, catalog: dict) -> None:
    for node_data in catalog.get("taxonomy", []):
        if node_data.get("kind") == "custom" and not session.get(TaxonomyNode, node_data["id"]):
            session.add(
                TaxonomyNode(
                    id=node_data["id"],
                    name=node_data["name"],
                    slug=node_data["slug"],
                    kind="custom",
                    parent_id=node_data.get("parent_id"),
                    aliases_json=json.dumps(node_data.get("aliases", []), ensure_ascii=False),
                    color=node_data.get("color"),
                    protected=False,
                    sort_order=node_data.get("sort_order", 0),
                )
            )
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

    _write_setting(
        session,
        BASELINE_KEY,
        {
            "records": records,
            "accepted_local_deletions": accepted_deletions,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    return {"applied": content_changes, "resolved": resolved}


def _record_export_baseline(session: Session) -> None:
    local = _local_records(session)
    _write_setting(
        session,
        BASELINE_KEY,
        {
            "records": {problem_id: _fingerprint(record) for problem_id, record in local.items()},
            "accepted_local_deletions": {},
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
