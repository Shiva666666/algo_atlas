from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from algo_atlas.db import slugify
from algo_atlas.models import TaxonomyNode
from algo_atlas.persistence.problems import taxonomy_to_dict
from algo_atlas.schemas import LeetCodeImportRequest
from algo_atlas.services.errors import ServiceError
from algo_atlas.taxonomy_seed import LEETCODE_ALIASES


def import_leetcode(payload: LeetCodeImportRequest, *, session: Session) -> dict:
    match = re.search(r"leetcode\.com/problems/([^/?#]+)", payload.url)
    if not match:
        raise ServiceError(422, "Paste a valid LeetCode problem URL.")
    problem_slug = slugify(match.group(1))
    data, warning = fetch_metadata(problem_slug, payload.url)
    nodes = session.scalars(select(TaxonomyNode)).all()
    by_slug = {node.slug: taxonomy_to_dict(node) for node in nodes}
    tags = data.get("topicTags", []) if data else []
    suggestions = [
        by_slug[mapped]
        for tag in tags
        if (mapped := LEETCODE_ALIASES.get(tag.get("slug", ""))) in by_slug
    ]
    return {
        "available": bool(data),
        "source_key": problem_slug,
        "slug": problem_slug,
        "url": payload.url,
        "title": data.get("title") if data else problem_slug.replace("-", " ").title(),
        "difficulty": data.get("difficulty", "Medium") if data else "Medium",
        "leetcode_id": data.get("questionId") if data else None,
        "raw_tags": tags,
        "suggestions": suggestions,
        "warning": warning,
    }


from algo_atlas.integrations.leetcode import fetch_metadata
