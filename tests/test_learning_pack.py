from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from algo_atlas.learning_pack import LEARNING_PACK, install_learning_pack
from algo_atlas.learning_pack_code import LEARNING_PACK_CODE
from algo_atlas.models import Problem


def test_learning_pack_is_idempotent_and_restores_only_blank_code(test_engine):
    first = install_learning_pack(test_engine)
    second = install_learning_pack(test_engine)

    assert first == {"created": len(LEARNING_PACK), "skipped": 0, "code_restored": 0}
    assert second == {"created": 0, "skipped": len(LEARNING_PACK), "code_restored": 0}

    with Session(test_engine) as session:
        assert session.scalar(select(func.count()).select_from(Problem)) == len(LEARNING_PACK)
        problems = list(session.scalars(select(Problem)).all())
        assert all(problem.python_code.strip() for problem in problems)

        preserved = problems[0]
        preserved_id = preserved.id
        preserved.python_code = "# my edited solution\n"
        blank = problems[1]
        blank_id = blank.id
        blank_key = blank.source_key
        blank.python_code = ""
        session.commit()

    restored = install_learning_pack(test_engine)
    assert restored == {"created": 0, "skipped": len(LEARNING_PACK), "code_restored": 1}

    with Session(test_engine) as session:
        assert session.get(Problem, preserved_id).python_code == "# my edited solution\n"
        assert session.get(Problem, blank_id).python_code == LEARNING_PACK_CODE[blank_key]
