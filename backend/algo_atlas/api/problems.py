from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from algo_atlas.db import get_session
from algo_atlas.schemas import MistakeCreate, ProblemCreate, ProblemUpdate
from algo_atlas.services import problems as operations

router = APIRouter()


@router.get("/api/problems")
def list_problems(
    q: str = "",
    status: str = "",
    difficulty: str = "",
    main_id: str = "",
    subtag_id: str = "",
    taxonomy_id: str = "",
    limit: int = 100,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> dict:
    return operations.list_problems(
        q=q,
        status=status,
        difficulty=difficulty,
        main_id=main_id,
        subtag_id=subtag_id,
        taxonomy_id=taxonomy_id,
        limit=limit,
        offset=offset,
        session=session,
    )


@router.get("/api/problems/{problem_id}")
def get_problem(problem_id: str, session: Session = Depends(get_session)) -> dict:
    return operations.get_problem(problem_id=problem_id, session=session)


@router.post("/api/problems", status_code=201)
def create_problem(payload: ProblemCreate, session: Session = Depends(get_session)) -> dict:
    return operations.create_problem(payload=payload, session=session)


@router.patch("/api/problems/{problem_id}")
def update_problem(
    problem_id: str, payload: ProblemUpdate, session: Session = Depends(get_session)
) -> dict:
    return operations.update_problem(problem_id=problem_id, payload=payload, session=session)


@router.delete("/api/problems/{problem_id}")
def delete_problem(problem_id: str, session: Session = Depends(get_session)) -> dict:
    return operations.delete_problem(problem_id=problem_id, session=session)


@router.post("/api/problems/{problem_id}/mistakes", status_code=201)
def add_mistake(
    problem_id: str, payload: MistakeCreate, session: Session = Depends(get_session)
) -> dict:
    return operations.add_mistake(problem_id=problem_id, payload=payload, session=session)
