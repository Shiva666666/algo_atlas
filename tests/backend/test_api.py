from __future__ import annotations

from algo_atlas.db import init_db
from algo_atlas.models import TaxonomyNode
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .conftest import sample_payload


def test_taxonomy_seed_is_idempotent(test_engine):
    with Session(test_engine) as session:
        initial_count = session.scalar(select(func.count()).select_from(TaxonomyNode))

    init_db(test_engine)

    with Session(test_engine) as session:
        assert session.scalar(select(func.count()).select_from(TaxonomyNode)) == initial_count
        subtag_keys = session.execute(
            select(TaxonomyNode.parent_id, TaxonomyNode.name).where(TaxonomyNode.kind == "sub")
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
    repeated = client.post(
        f"/api/problems/{problem['id']}/mistakes",
        json={"reason_ids": [reason["id"]], "observation": "Repeated under pressure."},
    )
    assert repeated.status_code == 201
    assert repeated.json()["mistake_count"] == 2

    patched = client.patch(
        f"/api/problems/{problem['id']}",
        json={"status": "Resolved", "notes": {"core_insight": ["Keep the invariant explicit."]}},
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "Resolved"

    overview = client.get("/api/analytics/overview").json()
    assert {
        key: overview["summary"][key] for key in ("total", "resolved", "open", "repeat_mistakes")
    } == {
        "total": 1,
        "resolved": 1,
        "open": 0,
        "repeat_mistakes": 1,
    }
    assert isinstance(overview["summary"]["unsynced_files"], int)
    graph = client.get("/api/analytics/atlas").json()
    assert any(node["id"] == problem["id"] for node in graph["nodes"])

    deleted = client.request("DELETE", f"/api/problems/{problem['id']}", json={})
    assert deleted.status_code == 200
    assert client.get("/api/problems").json()["total"] == 0


def test_write_guard_rejects_untrusted_origin(client, taxonomy):
    response = client.post(
        "/api/problems",
        json=sample_payload(taxonomy),
        headers={"Origin": "https://example.com", "X-Algo-Atlas": "1"},
    )
    assert response.status_code == 403


def test_leetcode_url_validation(client):
    response = client.post("/api/import/leetcode", json={"url": "https://example.com/not-leetcode"})
    assert response.status_code == 422


def test_solved_only_entry_has_no_initial_mistake(client, taxonomy):
    payload = sample_payload(taxonomy)
    payload.update(
        status="Resolved", record_initial_mistake=False, failure_reason_ids=[], observation=""
    )
    response = client.post("/api/problems", json=payload)
    assert response.status_code == 201, response.text
    problem = response.json()
    assert problem["mistake_count"] == 0
    assert problem["mistake_events"] == []
    assert client.get(f"/api/problems/{problem['id']}").json()["status"] == "Resolved"
    assert (
        client.get("/api/problems", params={"q": "boundary", "status": "Resolved"}).json()["total"]
        == 1
    )
    overview = client.get("/api/analytics/overview").json()
    assert overview["summary"]["resolved"] == 1
    assert overview["summary"]["repeat_mistakes"] == 0
    repeated = client.post(
        f"/api/problems/{problem['id']}/mistakes",
        json={"reason_ids": [taxonomy["failure_reasons"][0]["id"]]},
    )
    assert repeated.status_code == 201
    assert repeated.json()["mistake_count"] == 1


def test_sync_status_and_legacy_dry_run_interface(client):
    status = client.get("/api/sync/status")
    assert status.status_code == 200
    assert {
        "state",
        "creates",
        "updates",
        "conflicts",
        "review_version",
        "validation_error",
    } <= status.json().keys()

    dry_run = client.post("/api/export/restore", json={"dry_run": True})
    assert dry_run.status_code == 200
    assert dry_run.json()["state"] == status.json()["state"]


def test_html_entrypoint_revalidates(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-cache, must-revalidate"
