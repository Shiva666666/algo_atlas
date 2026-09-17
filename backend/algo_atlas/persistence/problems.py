from __future__ import annotations

import json

from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

from algo_atlas.models import (
    MistakeEvent,
    MistakeEventReason,
    Problem,
    ProblemTaxonomy,
    TaxonomyNode,
)


def load_problem(session: Session, problem_id: str) -> Problem | None:
    return session.scalar(
        select(Problem)
        .where(Problem.id == problem_id)
        .options(
            selectinload(Problem.primary_subtag).selectinload(TaxonomyNode.parent),
            selectinload(Problem.taxonomy_links).selectinload(ProblemTaxonomy.taxonomy),
            selectinload(Problem.note_bullets),
            selectinload(Problem.mistake_events)
            .selectinload(MistakeEvent.reason_links)
            .selectinload(MistakeEventReason.taxonomy),
        )
    )


def sync_problem_search(session: Session, problem: Problem) -> None:
    problem = load_problem(session, problem.id) or problem
    note_text = "\n".join(
        item.text
        for item in sorted(problem.note_bullets, key=lambda item: (item.section, item.position))
    )
    tag_text = " ".join(link.taxonomy.name for link in problem.taxonomy_links)
    tag_text += f" {problem.primary_subtag.name} {problem.primary_subtag.parent.name if problem.primary_subtag.parent else ''}"
    session.execute(
        text("DELETE FROM problem_search WHERE problem_id=:problem_id"), {"problem_id": problem.id}
    )
    session.execute(
        text(
            "INSERT INTO problem_search(problem_id,title,slug,notes,tags,python_code) VALUES(:id,:title,:slug,:notes,:tags,:code)"
        ),
        {
            "id": problem.id,
            "title": problem.title,
            "slug": problem.slug,
            "notes": note_text,
            "tags": tag_text,
            "code": problem.python_code,
        },
    )


def delete_problem_search(session: Session, problem_id: str) -> None:
    session.execute(
        text("DELETE FROM problem_search WHERE problem_id=:problem_id"), {"problem_id": problem_id}
    )


def rebuild_search(session: Session) -> None:
    session.execute(text("DELETE FROM problem_search"))
    for problem in session.scalars(select(Problem)).all():
        sync_problem_search(session, problem)


def taxonomy_to_dict(node: TaxonomyNode) -> dict:
    return {
        "id": node.id,
        "name": node.name,
        "slug": node.slug,
        "kind": node.kind,
        "parent_id": node.parent_id,
        "aliases": json.loads(node.aliases_json or "[]"),
        "color": node.color,
        "protected": node.protected,
        "sort_order": node.sort_order,
    }
