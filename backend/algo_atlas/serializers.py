from __future__ import annotations

from collections import defaultdict

from .db import taxonomy_to_dict
from .models import Problem


def iso(value):  # type: ignore[no-untyped-def]
    return value.isoformat() + ("Z" if value.tzinfo is None else "")


def problem_to_dict(problem: Problem, detail: bool = True) -> dict:
    main = problem.primary_subtag.parent
    taxonomy = sorted((taxonomy_to_dict(link.taxonomy) for link in problem.taxonomy_links), key=lambda node: (node["kind"], node["name"]))
    result = {
        "id": problem.id,
        "source": problem.source,
        "source_key": problem.source_key,
        "slug": problem.slug,
        "title": problem.title,
        "url": problem.url,
        "difficulty": problem.difficulty,
        "status": problem.status,
        "primary_subtag": taxonomy_to_dict(problem.primary_subtag),
        "primary_main": taxonomy_to_dict(main) if main else None,
        "taxonomy": taxonomy,
        "time_complexity": problem.time_complexity,
        "space_complexity": problem.space_complexity,
        "mistake_count": len(problem.mistake_events),
        "created_at": iso(problem.created_at),
        "updated_at": iso(problem.updated_at),
    }
    if not detail:
        return result
    notes: dict[str, list[str]] = defaultdict(list)
    for item in sorted(problem.note_bullets, key=lambda bullet: (bullet.section, bullet.position)):
        notes[item.section].append(item.text)
    events = []
    for event in sorted(problem.mistake_events, key=lambda item: item.occurred_at, reverse=True):
        events.append({
            "id": event.id,
            "occurred_at": iso(event.occurred_at),
            "observation": event.observation,
            "reasons": [taxonomy_to_dict(link.taxonomy) for link in event.reason_links],
        })
    result.update({"python_code": problem.python_code, "notes": dict(notes), "mistake_events": events})
    return result
