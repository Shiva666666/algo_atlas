from __future__ import annotations

import re

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from algo_atlas.db import slugify
from algo_atlas.models import (
    MistakeEvent,
    MistakeEventReason,
    NoteBullet,
    Problem,
    ProblemTaxonomy,
    TaxonomyNode,
    utcnow,
)
from algo_atlas.persistence.problems import delete_problem_search, load_problem, sync_problem_search
from algo_atlas.schemas import MistakeCreate, ProblemCreate, ProblemUpdate
from algo_atlas.serializers import problem_to_dict
from algo_atlas.services.errors import ServiceError
from algo_atlas.services.taxonomy import require_taxonomy


def _source_key(payload: ProblemCreate) -> str:
    if payload.source_key:
        return slugify(payload.source_key)
    if payload.url:
        match = re.search(r"/problems/([^/?#]+)", payload.url)
        if match:
            return slugify(match.group(1))
    return slugify(payload.title)


def _apply_notes(problem: Problem, notes: dict[str, list[str]]) -> None:
    problem.note_bullets.clear()
    for section, bullets in notes.items():
        for position, bullet in enumerate(bullets):
            problem.note_bullets.append(NoteBullet(section=section, position=position, text=bullet))


def _applyrequire_taxonomy(session: Session, problem: Problem, ids: list[str]) -> None:
    problem.taxonomy_links.clear()
    for node_id in dict.fromkeys(ids):
        node = require_taxonomy(session, node_id, {"pattern", "custom", "sub"})
        if node.id != problem.primary_subtag_id:
            problem.taxonomy_links.append(ProblemTaxonomy(taxonomy_id=node.id, role=node.kind))


def list_problems(
    q: str = "",
    status: str = "",
    difficulty: str = "",
    main_id: str = "",
    subtag_id: str = "",
    taxonomy_id: str = "",
    limit: int = 100,
    offset: int = 0,
    *,
    session: Session,
) -> dict:
    limit = max(1, min(limit, 250))
    statement = select(Problem.id).order_by(Problem.updated_at.desc())
    if status:
        statement = statement.where(Problem.status == status)
    if difficulty:
        statement = statement.where(Problem.difficulty == difficulty)
    if subtag_id:
        statement = statement.where(Problem.primary_subtag_id == subtag_id)
    if main_id:
        child_ids = select(TaxonomyNode.id).where(TaxonomyNode.parent_id == main_id)
        statement = statement.where(Problem.primary_subtag_id.in_(child_ids))
    if taxonomy_id:
        statement = statement.join(ProblemTaxonomy).where(
            ProblemTaxonomy.taxonomy_id == taxonomy_id
        )
    if q.strip():
        tokens = re.findall(r"[\w+#.-]+", q.lower())[:10]
        if tokens:
            fts_query = " AND ".join(f'"{token.replace(chr(34), "")}"*' for token in tokens)
            matches = text(
                "SELECT problem_id FROM problem_search WHERE problem_search MATCH :query"
            )
            ids = [row[0] for row in session.execute(matches, {"query": fts_query}).all()]
            statement = statement.where(Problem.id.in_(ids or ["__none__"]))
    all_ids = session.scalars(statement).all()
    page_ids = all_ids[offset : offset + limit]
    items = [
        problem_to_dict(problem, detail=False)
        for problem_id in page_ids
        if (problem := load_problem(session, problem_id))
    ]
    return {"items": items, "total": len(all_ids), "limit": limit, "offset": offset}


def get_problem(problem_id: str, *, session: Session) -> dict:
    problem = load_problem(session, problem_id)
    if not problem:
        raise ServiceError(404, "Problem not found.")
    return problem_to_dict(problem)


def create_problem(payload: ProblemCreate, *, session: Session) -> dict:
    subtag = require_taxonomy(session, payload.primary_subtag_id, {"sub"})
    if not subtag.parent or subtag.parent.kind != "main":
        raise ServiceError(422, "The primary sub-tag must belong to a main family.")
    source_key = _source_key(payload)
    if session.scalar(
        select(Problem.id).where(Problem.source == payload.source, Problem.source_key == source_key)
    ):
        raise ServiceError(409, "That source problem is already in your atlas.")
    problem = Problem(
        source=payload.source,
        source_key=source_key,
        slug=slugify(payload.slug or source_key),
        title=payload.title.strip(),
        url=payload.url,
        difficulty=payload.difficulty,
        status=payload.status,
        primary_subtag_id=subtag.id,
        python_code=payload.python_code,
        time_complexity=payload.time_complexity,
        space_complexity=payload.space_complexity,
    )
    session.add(problem)
    _applyrequire_taxonomy(session, problem, payload.taxonomy_ids)
    _apply_notes(problem, payload.notes)
    if payload.record_initial_mistake:
        event = MistakeEvent(
            occurred_at=(payload.occurred_at or utcnow()).replace(tzinfo=None),
            observation=payload.observation,
        )
        for reason_id in payload.failure_reason_ids:
            reason = require_taxonomy(session, reason_id, {"failure"})
            event.reason_links.append(MistakeEventReason(taxonomy_id=reason.id))
        problem.mistake_events.append(event)
    try:
        session.flush()
        sync_problem_search(session, problem)
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ServiceError(409, "That source problem is already in your atlas.") from exc
    return problem_to_dict(load_problem(session, problem.id))


def update_problem(problem_id: str, payload: ProblemUpdate, *, session: Session) -> dict:
    problem = load_problem(session, problem_id)
    if not problem:
        raise ServiceError(404, "Problem not found.")
    values = payload.model_dump(exclude_unset=True)
    if payload.primary_subtag_id is not None:
        subtag = require_taxonomy(session, payload.primary_subtag_id, {"sub"})
        if not subtag.parent:
            raise ServiceError(422, "The primary sub-tag must belong to a main family.")
        problem.primary_subtag_id = subtag.id
    for field in (
        "title",
        "url",
        "difficulty",
        "status",
        "python_code",
        "time_complexity",
        "space_complexity",
    ):
        if field in values:
            setattr(problem, field, values[field])
    if payload.taxonomy_ids is not None:
        _applyrequire_taxonomy(session, problem, payload.taxonomy_ids)
    if payload.notes is not None:
        _apply_notes(problem, payload.notes)
    problem.updated_at = utcnow()
    session.flush()
    sync_problem_search(session, problem)
    session.commit()
    return problem_to_dict(load_problem(session, problem.id))


def delete_problem(problem_id: str, *, session: Session) -> dict:
    problem = session.get(Problem, problem_id)
    if not problem:
        raise ServiceError(404, "Problem not found.")
    delete_problem_search(session, problem_id)
    session.delete(problem)
    session.commit()
    return {"deleted": problem_id}


def add_mistake(problem_id: str, payload: MistakeCreate, *, session: Session) -> dict:
    problem = load_problem(session, problem_id)
    if not problem:
        raise ServiceError(404, "Problem not found.")
    event = MistakeEvent(
        occurred_at=(payload.occurred_at or utcnow()).replace(tzinfo=None),
        observation=payload.observation,
    )
    for reason_id in payload.reason_ids:
        reason = require_taxonomy(session, reason_id, {"failure"})
        event.reason_links.append(MistakeEventReason(taxonomy_id=reason.id))
    problem.mistake_events.append(event)
    problem.updated_at = utcnow()
    session.flush()
    sync_problem_search(session, problem)
    session.commit()
    return problem_to_dict(load_problem(session, problem.id))
