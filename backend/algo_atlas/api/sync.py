from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from algo_atlas.db import get_session
from algo_atlas.schemas import GitSettingsUpdate, RestoreRequest
from algo_atlas.services import publishing as operations

router = APIRouter()


@router.post("/api/export/preview")
def export_preview(session: Session = Depends(get_session)) -> dict:
    return operations.export_preview(session=session)


@router.get("/api/sync/status")
def sync_status(session: Session = Depends(get_session)) -> dict:
    return operations.sync_status(session=session)


@router.post("/api/export/restore")
def restore(payload: RestoreRequest, session: Session = Depends(get_session)) -> dict:
    return operations.restore(payload=payload, session=session)


@router.get("/api/git")
def get_git_state() -> dict:
    return operations.get_git_state()


@router.patch("/api/git")
def update_git_settings(payload: GitSettingsUpdate) -> dict:
    return operations.update_git_settings(payload=payload)


@router.post("/api/git/preview")
def preview_publish(session: Session = Depends(get_session)) -> dict:
    return operations.preview_publish(session=session)


@router.post("/api/git/publish")
def publish(session: Session = Depends(get_session)) -> dict:
    return operations.publish(session=session)
