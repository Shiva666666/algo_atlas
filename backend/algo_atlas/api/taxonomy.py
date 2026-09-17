from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from algo_atlas.db import get_session
from algo_atlas.schemas import CustomTaxonomyCreate, TaxonomyAliasUpdate
from algo_atlas.services import taxonomy as operations

router = APIRouter()


@router.get("/api/taxonomy")
def get_taxonomy(session: Session = Depends(get_session)) -> dict:
    return operations.get_taxonomy(session=session)


@router.post("/api/taxonomy", status_code=201)
def create_custom_taxonomy(
    payload: CustomTaxonomyCreate, session: Session = Depends(get_session)
) -> dict:
    return operations.create_custom_taxonomy(payload=payload, session=session)


@router.patch("/api/taxonomy/{node_id}")
def update_taxonomy_aliases(
    node_id: str, payload: TaxonomyAliasUpdate, session: Session = Depends(get_session)
) -> dict:
    return operations.update_taxonomy_aliases(node_id=node_id, payload=payload, session=session)
