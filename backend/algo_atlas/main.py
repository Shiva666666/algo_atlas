from __future__ import annotations

import json
import re
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .analytics import analytics_overview, atlas_graph
from .config import settings
from .db import delete_problem_search, get_session, init_db, load_problem, slugify, sync_problem_search, taxonomy_to_dict
from .export_service import create_backup, export_catalog, restore_catalog
from .git_service import configure_git, git_state, preview_git, publish_git
from .models import MistakeEvent, MistakeEventReason, NoteBullet, Problem, ProblemTaxonomy, TaxonomyNode, utcnow
from .schemas import CustomTaxonomyCreate, GitSettingsUpdate, LeetCodeImportRequest, MistakeCreate, ProblemCreate, ProblemUpdate, RestoreRequest, TaxonomyAliasUpdate
from .serializers import problem_to_dict
from .taxonomy_seed import LEETCODE_ALIASES

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Algo Atlas", version="0.1.0", docs_url="/api/docs", openapi_url="/api/openapi.json", lifespan=lifespan)


@app.middleware("http")
async def local_write_guard(request: Request, call_next):  # type: ignore[no-untyped-def]
    if request.method in {"POST", "PATCH", "PUT", "DELETE"} and request.url.path.startswith("/api/"):
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type:
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "State-changing requests must use JSON."}, status_code=415)
        origin = request.headers.get("origin")
        allowed = bool(origin and re.match(r"^http://(127\.0\.0\.1|localhost)(:\d+)?$", origin))
        marker = request.headers.get("x-algo-atlas") == "1"
        if not allowed or not marker:
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Write request rejected: open Algo Atlas locally and retry."}, status_code=403)
    return await call_next(request)


def _taxonomy(session: Session, node_id: str, kinds: set[str] | None = None) -> TaxonomyNode:
    node = session.get(TaxonomyNode, node_id)
    if not node or (kinds and node.kind not in kinds):
        raise HTTPException(422, "Invalid taxonomy selection.")
    return node


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


def _apply_taxonomy(session: Session, problem: Problem, ids: list[str]) -> None:
    problem.taxonomy_links.clear()
    for node_id in dict.fromkeys(ids):
        node = _taxonomy(session, node_id, {"pattern", "custom", "sub"})
        if node.id != problem.primary_subtag_id:
            problem.taxonomy_links.append(ProblemTaxonomy(taxonomy_id=node.id, role=node.kind))


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "local": True, "version": app.version}


@app.get("/api/taxonomy")
def get_taxonomy(session: Session = Depends(get_session)) -> dict:
    nodes = session.scalars(select(TaxonomyNode).order_by(TaxonomyNode.kind, TaxonomyNode.sort_order, TaxonomyNode.name)).all()
    serialized = [taxonomy_to_dict(node) for node in nodes]
    return {
        "nodes": serialized,
        "main": [node for node in serialized if node["kind"] == "main"],
        "sub": [node for node in serialized if node["kind"] == "sub"],
        "patterns": [node for node in serialized if node["kind"] in {"pattern", "custom"}],
        "failure_reasons": [node for node in serialized if node["kind"] == "failure"],
    }


@app.post("/api/taxonomy", status_code=201)
def create_custom_taxonomy(payload: CustomTaxonomyCreate, session: Session = Depends(get_session)) -> dict:
    if payload.parent_id:
        _taxonomy(session, payload.parent_id, {"main", "sub"})
    base_slug = f"custom-{slugify(payload.name)}"
    candidate = base_slug
    suffix = 2
    while session.scalar(select(TaxonomyNode).where(TaxonomyNode.slug == candidate)):
        candidate = f"{base_slug}-{suffix}"
        suffix += 1
    node = TaxonomyNode(name=payload.name.strip(), slug=candidate, kind="custom", parent_id=payload.parent_id, aliases_json=json.dumps(payload.aliases, ensure_ascii=False))
    session.add(node)
    session.commit()
    session.refresh(node)
    return taxonomy_to_dict(node)


@app.patch("/api/taxonomy/{node_id}")
def update_taxonomy_aliases(node_id: str, payload: TaxonomyAliasUpdate, session: Session = Depends(get_session)) -> dict:
    node = _taxonomy(session, node_id)
    node.aliases_json = json.dumps(sorted(set(alias.strip() for alias in payload.aliases if alias.strip())), ensure_ascii=False)
    session.commit()
    return taxonomy_to_dict(node)


@app.get("/api/problems")
def list_problems(q: str = "", status: str = "", difficulty: str = "", main_id: str = "", subtag_id: str = "", taxonomy_id: str = "", limit: int = 100, offset: int = 0, session: Session = Depends(get_session)) -> dict:
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
        statement = statement.join(ProblemTaxonomy).where(ProblemTaxonomy.taxonomy_id == taxonomy_id)
    if q.strip():
        tokens = re.findall(r"[\w+#.-]+", q.lower())[:10]
        if tokens:
            fts_query = " AND ".join(f'"{token.replace(chr(34), "")}"*' for token in tokens)
            matches = text("SELECT problem_id FROM problem_search WHERE problem_search MATCH :query")
            ids = [row[0] for row in session.execute(matches, {"query": fts_query}).all()]
            statement = statement.where(Problem.id.in_(ids or ["__none__"]))
    all_ids = session.scalars(statement).all()
    page_ids = all_ids[offset:offset + limit]
    items = [problem_to_dict(problem, detail=False) for problem_id in page_ids if (problem := load_problem(session, problem_id))]
    return {"items": items, "total": len(all_ids), "limit": limit, "offset": offset}


@app.get("/api/problems/{problem_id}")
def get_problem(problem_id: str, session: Session = Depends(get_session)) -> dict:
    problem = load_problem(session, problem_id)
    if not problem:
        raise HTTPException(404, "Problem not found.")
    return problem_to_dict(problem)


@app.post("/api/problems", status_code=201)
def create_problem(payload: ProblemCreate, session: Session = Depends(get_session)) -> dict:
    subtag = _taxonomy(session, payload.primary_subtag_id, {"sub"})
    if not subtag.parent or subtag.parent.kind != "main":
        raise HTTPException(422, "The primary sub-tag must belong to a main family.")
    source_key = _source_key(payload)
    if session.scalar(select(Problem.id).where(Problem.source == payload.source, Problem.source_key == source_key)):
        raise HTTPException(409, "That source problem is already in your atlas.")
    problem = Problem(source=payload.source, source_key=source_key, slug=slugify(payload.slug or source_key), title=payload.title.strip(), url=payload.url, difficulty=payload.difficulty, status=payload.status, primary_subtag_id=subtag.id, python_code=payload.python_code, time_complexity=payload.time_complexity, space_complexity=payload.space_complexity)
    session.add(problem)
    _apply_taxonomy(session, problem, payload.taxonomy_ids)
    _apply_notes(problem, payload.notes)
    event = MistakeEvent(occurred_at=(payload.occurred_at or utcnow()).replace(tzinfo=None), observation=payload.observation)
    for reason_id in payload.failure_reason_ids:
        reason = _taxonomy(session, reason_id, {"failure"})
        event.reason_links.append(MistakeEventReason(taxonomy_id=reason.id))
    problem.mistake_events.append(event)
    try:
        session.flush()
        sync_problem_search(session, problem)
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(409, "That source problem is already in your atlas.") from exc
    return problem_to_dict(load_problem(session, problem.id))


@app.patch("/api/problems/{problem_id}")
def update_problem(problem_id: str, payload: ProblemUpdate, session: Session = Depends(get_session)) -> dict:
    problem = load_problem(session, problem_id)
    if not problem:
        raise HTTPException(404, "Problem not found.")
    values = payload.model_dump(exclude_unset=True)
    if payload.primary_subtag_id is not None:
        subtag = _taxonomy(session, payload.primary_subtag_id, {"sub"})
        if not subtag.parent:
            raise HTTPException(422, "The primary sub-tag must belong to a main family.")
        problem.primary_subtag_id = subtag.id
    for field in ("title", "url", "difficulty", "status", "python_code", "time_complexity", "space_complexity"):
        if field in values:
            setattr(problem, field, values[field])
    if payload.taxonomy_ids is not None:
        _apply_taxonomy(session, problem, payload.taxonomy_ids)
    if payload.notes is not None:
        _apply_notes(problem, payload.notes)
    problem.updated_at = utcnow()
    session.flush()
    sync_problem_search(session, problem)
    session.commit()
    return problem_to_dict(load_problem(session, problem.id))


@app.delete("/api/problems/{problem_id}")
def delete_problem(problem_id: str, session: Session = Depends(get_session)) -> dict:
    problem = session.get(Problem, problem_id)
    if not problem:
        raise HTTPException(404, "Problem not found.")
    delete_problem_search(session, problem_id)
    session.delete(problem)
    session.commit()
    return {"deleted": problem_id}


@app.post("/api/problems/{problem_id}/mistakes", status_code=201)
def add_mistake(problem_id: str, payload: MistakeCreate, session: Session = Depends(get_session)) -> dict:
    problem = load_problem(session, problem_id)
    if not problem:
        raise HTTPException(404, "Problem not found.")
    event = MistakeEvent(occurred_at=(payload.occurred_at or utcnow()).replace(tzinfo=None), observation=payload.observation)
    for reason_id in payload.reason_ids:
        reason = _taxonomy(session, reason_id, {"failure"})
        event.reason_links.append(MistakeEventReason(taxonomy_id=reason.id))
    problem.mistake_events.append(event)
    problem.updated_at = utcnow()
    session.flush()
    sync_problem_search(session, problem)
    session.commit()
    return problem_to_dict(load_problem(session, problem.id))


@app.get("/api/analytics/overview")
def overview(session: Session = Depends(get_session)) -> dict:
    return analytics_overview(session)


@app.get("/api/analytics/atlas")
def atlas(session: Session = Depends(get_session)) -> dict:
    return atlas_graph(session)


@app.post("/api/import/leetcode")
def import_leetcode(payload: LeetCodeImportRequest, session: Session = Depends(get_session)) -> dict:
    match = re.search(r"leetcode\.com/problems/([^/?#]+)", payload.url)
    if not match:
        raise HTTPException(422, "Paste a valid LeetCode problem URL.")
    problem_slug = slugify(match.group(1))
    query = """query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { questionId title titleSlug difficulty topicTags { name slug } } }"""
    warning = None
    data = None
    try:
        response = httpx.post("https://leetcode.com/graphql", json={"query": query, "variables": {"titleSlug": problem_slug}}, headers={"User-Agent": "AlgoAtlas/0.1", "Referer": payload.url}, timeout=6.0)
        response.raise_for_status()
        data = response.json().get("data", {}).get("question")
    except Exception:
        warning = "LeetCode metadata is unavailable right now; the URL and inferred title are ready for manual entry."
    nodes = session.scalars(select(TaxonomyNode)).all()
    by_slug = {node.slug: taxonomy_to_dict(node) for node in nodes}
    tags = data.get("topicTags", []) if data else []
    suggestions = [by_slug[mapped] for tag in tags if (mapped := LEETCODE_ALIASES.get(tag.get("slug", ""))) in by_slug]
    return {
        "available": bool(data), "source_key": problem_slug, "slug": problem_slug, "url": payload.url,
        "title": data.get("title") if data else problem_slug.replace("-", " ").title(),
        "difficulty": data.get("difficulty", "Medium") if data else "Medium",
        "leetcode_id": data.get("questionId") if data else None,
        "raw_tags": tags, "suggestions": suggestions, "warning": warning,
    }


@app.post("/api/export/preview")
def export_preview(session: Session = Depends(get_session)) -> dict:
    backup = create_backup()
    catalog = export_catalog(session)
    preview = preview_git(fetch=False)
    return {"catalog": catalog, "backup": backup.name if backup else None, "git": preview}


@app.post("/api/export/restore")
def restore(payload: RestoreRequest, session: Session = Depends(get_session)) -> dict:
    if not payload.dry_run:
        create_backup()
    return restore_catalog(session, dry_run=payload.dry_run)


@app.get("/api/git")
def get_git_state() -> dict:
    return git_state(fetch=False)


@app.patch("/api/git")
def update_git_settings(payload: GitSettingsUpdate) -> dict:
    try:
        return configure_git(payload.remote_url, payload.branch, payload.user_name, payload.user_email)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(422, str(exc)) from exc


@app.post("/api/git/preview")
def preview_publish(session: Session = Depends(get_session)) -> dict:
    backup = create_backup()
    export_catalog(session)
    result = preview_git(fetch=True)
    result["backup"] = backup.name if backup else None
    return result


@app.post("/api/git/publish")
def publish(session: Session = Depends(get_session)) -> dict:
    create_backup()
    export_catalog(session)
    try:
        return publish_git()
    except RuntimeError as exc:
        raise HTTPException(409, str(exc)) from exc


if (settings.frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=settings.frontend_dist / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str):  # type: ignore[no-untyped-def]
    requested = (settings.frontend_dist / full_path).resolve()
    if settings.frontend_dist.exists() and requested.is_relative_to(settings.frontend_dist.resolve()) and requested.is_file():
        return FileResponse(requested)
    index = settings.frontend_dist / "index.html"
    if index.exists():
        return FileResponse(index)
    raise HTTPException(404, "Frontend build not found. Run npm run build.")
