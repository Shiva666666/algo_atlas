from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from algo_atlas.db import init_db
from algo_atlas.models import TaxonomyNode

from .conftest import sample_payload


def test_taxonomy_seed_is_idempotent(test_engine):
    with Session(test_engine) as session:
        initial_count = session.scalar(select(func.count()).select_from(TaxonomyNode))

    init_db(test_engine)

    with Session(test_engine) as session:
        assert session.scalar(select(func.count()).select_from(TaxonomyNode)) == initial_count
        subtag_keys = session.execute(
            select(TaxonomyNode.parent_id, TaxonomyNode.name)
            .where(TaxonomyNode.kind == "sub")
        ).all()
        assert len(subtag_keys) == len(set(subtag_keys))


def test_crud_search_analytics_and_repeat(client, taxonomy):
    created = client.post("/api/problems", json=sample_payload(taxonomy))
    assert created.status_code == 201, created.text
    problem = created.json()
    assert problem["mistake_count"] == 1
    duplicate = client.post("/api/problems", json=sample_payload(taxonomy))
    assert duplicate.status_code == 409

    search = client.get("/api/problems", params={"q": "boundary"}).json()
    assert search["total"] == 1
    assert search["items"][0]["id"] == problem["id"]

    reason = taxonomy["failure_reasons"][0]
    repeated = client.post(f"/api/problems/{problem['id']}/mistakes", json={"reason_ids": [reason["id"]], "observation": "Repeated under pressure."})
    assert repeated.status_code == 201
    assert repeated.json()["mistake_count"] == 2

    patched = client.patch(f"/api/problems/{problem['id']}", json={"status": "Resolved", "notes": {"core_insight": ["Keep the invariant explicit."]}})
    assert patched.status_code == 200
    assert patched.json()["status"] == "Resolved"

    overview = client.get("/api/analytics/overview").json()
    assert {key: overview["summary"][key] for key in ("total", "resolved", "open", "repeat_mistakes")} == {
        "total": 1, "resolved": 1, "open": 0, "repeat_mistakes": 1,
    }
    assert isinstance(overview["summary"]["unsynced_files"], int)
    graph = client.get("/api/analytics/atlas").json()
    assert any(node["id"] == problem["id"] for node in graph["nodes"])

    deleted = client.request("DELETE", f"/api/problems/{problem['id']}", json={})
    assert deleted.status_code == 200
    assert client.get("/api/problems").json()["total"] == 0


def test_write_guard_rejects_untrusted_origin(client, taxonomy):
    response = client.post("/api/problems", json=sample_payload(taxonomy), headers={"Origin": "https://example.com", "X-Algo-Atlas": "1"})
    assert response.status_code == 403


def test_leetcode_url_validation(client):
    response = client.post("/api/import/leetcode", json={"url": "https://example.com/not-leetcode"})
    assert response.status_code == 422
