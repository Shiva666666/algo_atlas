from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from algo_atlas.db import get_session
from algo_atlas.schemas import LeetCodeImportRequest
from algo_atlas.services import imports as operations

router = APIRouter()


@router.post("/api/import/leetcode")
def import_leetcode(
    payload: LeetCodeImportRequest, session: Session = Depends(get_session)
) -> dict:
    return operations.import_leetcode(payload=payload, session=session)
