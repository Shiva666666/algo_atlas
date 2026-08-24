from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from algo_atlas.db import build_engine, get_session, init_db
from algo_atlas.main import app


@pytest.fixture()
def test_engine(tmp_path):
    engine = build_engine(f"sqlite:///{(tmp_path / 'test.db').as_posix()}")
    init_db(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def client(test_engine) -> Generator[TestClient, None, None]:
    def override_session():
        with Session(test_engine) as session:
            yield session
    app.dependency_overrides[get_session] = override_session
    test_client = TestClient(app, headers={"Origin": "http://127.0.0.1:5173", "X-Algo-Atlas": "1"})
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def taxonomy(client: TestClient) -> dict:
    return client.get("/api/taxonomy").json()


def sample_payload(taxonomy: dict) -> dict:
    main = next(node for node in taxonomy["main"] if node["slug"] == "arrays-strings")
    sub = next(node for node in taxonomy["sub"] if node["parent_id"] == main["id"])
    pattern = next(node for node in taxonomy["patterns"] if node["slug"] == "sliding-window")
    failure = next(node for node in taxonomy["failure_reasons"] if "boundary" in node["slug"])
    return {
        "title": "Longest Signal Window",
        "url": "https://leetcode.com/problems/longest-signal-window/",
        "difficulty": "Medium",
        "status": "Open",
        "primary_subtag_id": sub["id"],
        "taxonomy_ids": [pattern["id"]],
        "failure_reason_ids": [failure["id"]],
        "python_code": "def solve(nums):\n    return len(nums)\n",
        "time_complexity": "O(n)",
        "space_complexity": "O(1)",
        "notes": {"why_missed": ["Boundary moved before the count was updated."], "core_insight": ["Maintain one valid window."]},
        "observation": "Missed the left-boundary update.",
    }
