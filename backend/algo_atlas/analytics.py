from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import load_problem, taxonomy_to_dict
from .git_service import preview_git
from .models import Problem, TaxonomyNode
from .serializers import problem_to_dict


def analytics_overview(session: Session) -> dict:
    problem_ids = session.scalars(select(Problem.id).order_by(Problem.updated_at.desc())).all()
    problems = [problem for problem_id in problem_ids if (problem := load_problem(session, problem_id))]
    taxonomy = session.scalars(select(TaxonomyNode).order_by(TaxonomyNode.sort_order, TaxonomyNode.name)).all()
    mains = [node for node in taxonomy if node.kind == "main"]
    failures = [node for node in taxonomy if node.kind == "failure"]
    domains: dict[str, dict] = {
        node.id: {**taxonomy_to_dict(node), "count": 0, "open": 0, "repeat_mistakes": 0} for node in mains
    }
    pattern_counts: Counter[str] = Counter()
    activity: Counter[str] = Counter()
    failure_matrix: dict[str, Counter[str]] = defaultdict(Counter)
    repeated = 0
    for problem in problems:
        main = problem.primary_subtag.parent
        if not main:
            continue
        domains[main.id]["count"] += 1
        domains[main.id]["open"] += int(problem.status != "Resolved")
        domains[main.id]["repeat_mistakes"] += max(0, len(problem.mistake_events) - 1)
        repeated += max(0, len(problem.mistake_events) - 1)
        for link in problem.taxonomy_links:
            if link.taxonomy.kind in {"pattern", "custom"}:
                pattern_counts[link.taxonomy.name] += 1
        for event in problem.mistake_events:
            activity[event.occurred_at.date().isoformat()] += 1
            for reason in event.reason_links:
                failure_matrix[main.id][reason.taxonomy.id] += 1
    dates = []
    today = datetime.now().date()
    for offset in range(89, -1, -1):
        date = today - timedelta(days=offset)
        dates.append({"date": date.isoformat(), "count": activity[date.isoformat()]})
    matrix = [
        {"main_id": main.id, "main": main.name, "reason_id": reason.id, "reason": reason.name, "value": failure_matrix[main.id][reason.id]}
        for main in mains for reason in failures if failure_matrix[main.id][reason.id]
    ]
    sync = preview_git(fetch=False)
    return {
        "summary": {
            "total": len(problems),
            "resolved": sum(problem.status == "Resolved" for problem in problems),
            "open": sum(problem.status != "Resolved" for problem in problems),
            "repeat_mistakes": repeated,
            "unsynced_files": len(sync["changes"]),
        },
        "domains": list(domains.values()),
        "patterns": [{"name": name, "count": count} for name, count in pattern_counts.most_common(12)],
        "activity": dates,
        "failure_reasons": [taxonomy_to_dict(node) for node in failures],
        "failure_matrix": matrix,
        "recent": [problem_to_dict(problem, detail=False) for problem in problems[:8]],
    }


def atlas_graph(session: Session) -> dict:
    taxonomy = session.scalars(select(TaxonomyNode).order_by(TaxonomyNode.sort_order, TaxonomyNode.name)).all()
    nodes: list[dict] = []
    links: list[dict] = []
    counts: Counter[str] = Counter()
    problem_ids = session.scalars(select(Problem.id).order_by(Problem.updated_at.desc()).limit(1500)).all()
    problems = [problem for problem_id in problem_ids if (problem := load_problem(session, problem_id))]
    for problem in problems:
        counts[problem.primary_subtag_id] += 1
        if problem.primary_subtag.parent_id:
            counts[problem.primary_subtag.parent_id] += 1
    included_taxonomy = {node.id: node for node in taxonomy if node.kind in {"main", "sub"}}
    pattern_ids = {link.taxonomy_id for problem in problems for link in problem.taxonomy_links if link.taxonomy.kind in {"pattern", "custom"}}
    included_taxonomy.update({node.id: node for node in taxonomy if node.id in pattern_ids})
    for node in included_taxonomy.values():
        nodes.append({"id": node.id, "name": node.name, "kind": node.kind, "color": node.color or "#8791a8", "value": max(3, counts[node.id] + (18 if node.kind == "main" else 7))})
        if node.parent_id:
            links.append({"source": node.parent_id, "target": node.id, "kind": "hierarchy"})
    for problem in problems:
        main = problem.primary_subtag.parent
        nodes.append({
            "id": problem.id, "name": problem.title, "kind": "problem", "color": main.color if main else "#8791a8",
            "value": 2 + min(8, len(problem.mistake_events) * 1.5), "status": problem.status,
            "difficulty": problem.difficulty, "updated_at": problem.updated_at.isoformat() + "Z",
        })
        links.append({"source": problem.primary_subtag_id, "target": problem.id, "kind": "primary"})
        for link in problem.taxonomy_links:
            if link.taxonomy_id in pattern_ids:
                links.append({"source": link.taxonomy_id, "target": problem.id, "kind": "pattern"})
    return {"nodes": nodes, "links": links, "aggregated": len(problem_ids) >= 1500}
