from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from algo_atlas.learning_pack import LEARNING_PACK, install_learning_pack
from algo_atlas.models import Problem


def test_learning_pack_is_idempotent_and_contains_no_solution_code(test_engine):
    first = install_learning_pack(test_engine)
    second = install_learning_pack(test_engine)

    assert first == {"created": len(LEARNING_PACK), "skipped": 0}
    assert second == {"created": 0, "skipped": len(LEARNING_PACK)}

    with Session(test_engine) as session:
        assert session.scalar(select(func.count()).select_from(Problem)) == len(LEARNING_PACK)
        assert all(problem.python_code == "" for problem in session.scalars(select(Problem)).all())
