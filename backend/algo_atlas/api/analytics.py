from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from algo_atlas.db import get_session
from algo_atlas.services import analytics_endpoints as operations

router = APIRouter()


@router.get("/api/analytics/overview")
def overview(session: Session = Depends(get_session)) -> dict:
    return operations.overview(session=session)


@router.get("/api/analytics/atlas")
def atlas(session: Session = Depends(get_session)) -> dict:
    return operations.atlas(session=session)
