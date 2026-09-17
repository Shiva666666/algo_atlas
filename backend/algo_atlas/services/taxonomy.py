from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from algo_atlas.db import slugify
from algo_atlas.models import TaxonomyNode
from algo_atlas.persistence.problems import taxonomy_to_dict
from algo_atlas.schemas import CustomTaxonomyCreate, TaxonomyAliasUpdate
from algo_atlas.services.errors import ServiceError


def require_taxonomy(session: Session, node_id: str, kinds: set[str] | None = None) -> TaxonomyNode:
    node = session.get(TaxonomyNode, node_id)
    if not node or (kinds and node.kind not in kinds):
        raise ServiceError(422, "Invalid taxonomy selection.")
    return node


def get_taxonomy(*, session: Session) -> dict:
    nodes = session.scalars(
        select(TaxonomyNode).order_by(TaxonomyNode.kind, TaxonomyNode.sort_order, TaxonomyNode.name)
    ).all()
    serialized = [taxonomy_to_dict(node) for node in nodes]
    return {
        "nodes": serialized,
        "main": [node for node in serialized if node["kind"] == "main"],
        "sub": [node for node in serialized if node["kind"] == "sub"],
        "patterns": [node for node in serialized if node["kind"] in {"pattern", "custom"}],
        "failure_reasons": [node for node in serialized if node["kind"] == "failure"],
    }


def create_custom_taxonomy(payload: CustomTaxonomyCreate, *, session: Session) -> dict:
    if payload.parent_id:
        require_taxonomy(session, payload.parent_id, {"main", "sub"})
    base_slug = f"custom-{slugify(payload.name)}"
    candidate = base_slug
    suffix = 2
    while session.scalar(select(TaxonomyNode).where(TaxonomyNode.slug == candidate)):
        candidate = f"{base_slug}-{suffix}"
        suffix += 1
    node = TaxonomyNode(
        name=payload.name.strip(),
        slug=candidate,
        kind="custom",
        parent_id=payload.parent_id,
        aliases_json=json.dumps(payload.aliases, ensure_ascii=False),
    )
    session.add(node)
    session.commit()
    session.refresh(node)
    return taxonomy_to_dict(node)


def update_taxonomy_aliases(
    node_id: str, payload: TaxonomyAliasUpdate, *, session: Session
) -> dict:
    node = require_taxonomy(session, node_id)
    node.aliases_json = json.dumps(
        sorted(set(alias.strip() for alias in payload.aliases if alias.strip())), ensure_ascii=False
    )
    session.commit()
    return taxonomy_to_dict(node)
