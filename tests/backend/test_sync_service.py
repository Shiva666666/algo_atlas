import hashlib
import json
import shutil
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path

import pytest
from algo_atlas.config import settings as default_settings
from algo_atlas.db import build_engine, init_db
from algo_atlas.integrations import exports as export_service
from algo_atlas.models import (
    AppSetting,
    MistakeEvent,
    MistakeEventReason,
    NoteBullet,
    Problem,
    ProblemTaxonomy,
    TaxonomyNode,
)
from algo_atlas.persistence.problems import delete_problem_search, load_problem, sync_problem_search
from algo_atlas.services import sync as sync_service
from algo_atlas.services.sync.state import BASELINE_KEY, LEGACY_MARKER_KEY
from sqlalchemy import text
from sqlalchemy.orm import Session


def device_settings(root: Path, export_dir: Path, name: str):
    local = root / name / ".local"
    local.mkdir(parents=True)
    return replace(
        default_settings,
        root_dir=root,
        local_dir=local,
        database_path=local / "algo_atlas.db",
        backup_dir=local / "backups",
        export_dir=export_dir,
        frontend_dist=root / name / "dist",
    )


def activate(monkeypatch, settings) -> None:
    monkeypatch.setattr(export_service, "settings", settings)
    monkeypatch.setattr(sync_service, "settings", settings)


def build_device(settings):
    engine = build_engine(f"sqlite:///{settings.database_path.as_posix()}")
    init_db(engine)
    return engine


def first_problem_id(session: Session) -> str:
    return session.query(Problem.id).order_by(Problem.id).first()[0]


def edit_title(session: Session, problem_id: str, title: str) -> None:
    problem = load_problem(session, problem_id)
    assert problem is not None
    problem.title = title
    problem.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    session.flush()
    sync_problem_search(session, problem)
    session.commit()


@pytest.fixture()
def two_devices(tmp_path, monkeypatch):
    shared_exports = tmp_path / "exports"
    shared_exports.mkdir()
    settings_a = device_settings(tmp_path, shared_exports, "device-a")
    settings_b = device_settings(tmp_path, shared_exports, "device-b")
    engine_a = build_device(settings_a)
    engine_b = build_device(settings_b)
    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        subtag = session.query(TaxonomyNode).filter(TaxonomyNode.kind == "sub").first()
        problem = Problem(
            source="leetcode",
            source_key="sample",
            slug="sample",
            title="Sample problem",
            difficulty="Medium",
            status="Open",
            primary_subtag_id=subtag.id,
            python_code="def solve():\n    return 1\n",
        )
        session.add(problem)
        session.flush()
        sync_problem_search(session, problem)
        session.commit()
        export_service.export_catalog(session)
        sync_service.reconcile_catalog(session, dry_run=False)
    activate(monkeypatch, settings_b)
    with Session(engine_b) as session:
        sync_service.reconcile_catalog(session, dry_run=False)
    yield settings_a, engine_a, settings_b, engine_b, shared_exports
    engine_a.dispose()
    engine_b.dispose()


def test_incoming_only_changes_apply_and_local_only_changes_are_preserved(two_devices, monkeypatch):
    settings_a, engine_a, settings_b, engine_b, _exports = two_devices
    with Session(engine_b) as session:
        problem_id = first_problem_id(session)
        edit_title(session, problem_id, "Changed on device B")
        problem = load_problem(session, problem_id)
        pattern = session.query(TaxonomyNode).filter(TaxonomyNode.kind == "pattern").first()
        reason = session.query(TaxonomyNode).filter(TaxonomyNode.kind == "failure").first()
        problem.python_code = "def remote_solution():\n    return 'needle-code'\n"
        problem.note_bullets.append(
            NoteBullet(section="core_insight", position=0, text="needle-note")
        )
        problem.taxonomy_links.append(ProblemTaxonomy(taxonomy_id=pattern.id, role="pattern"))
        event = MistakeEvent(observation="needle-history")
        event.reason_links.append(MistakeEventReason(taxonomy_id=reason.id))
        problem.mistake_events.append(event)
        session.flush()
        sync_problem_search(session, problem)
        session.commit()
        activate(monkeypatch, settings_b)
        export_service.export_catalog(session)

    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        result = sync_service.reconcile_catalog(session, dry_run=False)
        assert result["applied"] == 1
        imported = load_problem(session, problem_id)
        assert imported.title == "Changed on device B"
        assert "needle-code" in imported.python_code
        assert imported.note_bullets[0].text == "needle-note"
        assert imported.taxonomy_links[0].taxonomy_id == pattern.id
        assert imported.mistake_events[0].observation == "needle-history"
        assert (
            session.execute(
                text("SELECT problem_id FROM problem_search WHERE problem_search MATCH :query"),
                {"query": '"needle"*'},
            ).scalar_one()
            == problem_id
        )
        edit_title(session, problem_id, "New local draft")
        status = sync_service.inspect_sync(session)
        assert status["state"] == "clean"
        assert status["local_changes"] == 1
        assert sync_service.reconcile_catalog(session, dry_run=False)["applied"] == 0
        assert load_problem(session, problem_id).title == "New local draft"


def test_both_changed_requires_current_review_and_keep_local_can_be_published(
    two_devices, monkeypatch
):
    settings_a, engine_a, settings_b, engine_b, shared_exports = two_devices
    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        problem_id = first_problem_id(session)
        edit_title(session, problem_id, "Device A version")
    activate(monkeypatch, settings_b)
    with Session(engine_b) as session:
        edit_title(session, problem_id, "Device B version")
        export_service.export_catalog(session)

    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        status = sync_service.inspect_sync(session)
        assert status["state"] == "conflicts"
        assert status["conflicts"][0]["kind"] == "both_changed"
        assert "title" in status["conflicts"][0]["changed_fields"]
        title_comparison = next(
            item for item in status["conflicts"][0]["field_comparisons"] if item["field"] == "title"
        )
        assert title_comparison == {
            "field": "title",
            "label": "title",
            "local": "Device A version",
            "incoming": "Device B version",
        }
        export_before = {
            path.relative_to(shared_exports).as_posix(): path.read_bytes()
            for path in shared_exports.rglob("*")
            if path.is_file()
        }
        with pytest.raises(sync_service.SyncBlockedError, match="Publishing is blocked"):
            sync_service.prepare_export(session)
        assert export_before == {
            path.relative_to(shared_exports).as_posix(): path.read_bytes()
            for path in shared_exports.rglob("*")
            if path.is_file()
        }
        with pytest.raises(sync_service.SyncBlockedError, match="changed during review"):
            sync_service.reconcile_catalog(
                session,
                dry_run=False,
                decisions={problem_id: "keep_local"},
                review_version="stale",
            )
        resolved = sync_service.reconcile_catalog(
            session,
            dry_run=False,
            decisions={problem_id: "keep_local"},
            review_version=status["review_version"],
        )
        assert resolved["state"] == "clean"
        assert load_problem(session, problem_id).title == "Device A version"
        prepared = sync_service.prepare_export(session)
        assert prepared["catalog"]["record_count"] > 0
        assert "Device A version" in next(shared_exports.rglob("README.md")).read_text(
            encoding="utf-8"
        ) or any(
            "Device A version" in path.read_text(encoding="utf-8")
            for path in shared_exports.rglob("README.md")
        )


def test_deletions_require_review_and_use_incoming_deletes_after_backup(two_devices, monkeypatch):
    settings_a, engine_a, settings_b, engine_b, _exports = two_devices
    activate(monkeypatch, settings_b)
    with Session(engine_b) as session:
        problem_id = first_problem_id(session)
        delete_problem_search(session, problem_id)
        session.delete(session.get(Problem, problem_id))
        session.commit()
        export_service.export_catalog(session)

    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        status = sync_service.inspect_sync(session)
        conflict = next(item for item in status["conflicts"] if item["id"] == problem_id)
        assert conflict["kind"] == "incoming_deleted"
        assert session.get(Problem, problem_id) is not None
        resolved = sync_service.reconcile_catalog(
            session,
            dry_run=False,
            decisions={problem_id: "use_incoming"},
            review_version=status["review_version"],
        )
        assert resolved["state"] == "clean"
        assert session.get(Problem, problem_id) is None
        assert list(settings_a.backup_dir.glob("algo-atlas-*.db"))


def test_invalid_export_and_backup_failure_never_change_local_data(two_devices, monkeypatch):
    settings_a, engine_a, settings_b, engine_b, shared_exports = two_devices
    activate(monkeypatch, settings_b)
    with Session(engine_b) as session:
        problem_id = first_problem_id(session)
        edit_title(session, problem_id, "Remote update")
        export_service.export_catalog(session)

    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        original = load_problem(session, problem_id).title
        monkeypatch.setattr(
            sync_service,
            "create_backup",
            lambda: (_ for _ in ()).throw(OSError("backup unavailable")),
        )
        with pytest.raises(sync_service.SyncBlockedError, match="required local backup"):
            sync_service.reconcile_catalog(session, dry_run=False)
        session.rollback()
        assert load_problem(session, problem_id).title == original

    solution = next(shared_exports.rglob("solution.py"))
    solution.write_text("# corrupt\n", encoding="utf-8")
    with Session(engine_a) as session:
        status = sync_service.inspect_sync(session)
        assert status["state"] == "invalid"
        assert "Hash mismatch" in status["validation_error"]
        with pytest.raises(sync_service.SyncBlockedError, match="invalid"):
            sync_service.prepare_export(session)


def test_local_deletion_and_duplicate_identity_require_review(two_devices, monkeypatch):
    settings_a, engine_a, settings_b, _engine_b, _exports = two_devices
    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        problem_id = first_problem_id(session)
        original = session.get(Problem, problem_id)
        source, source_key = original.source, original.source_key
        delete_problem_search(session, problem_id)
        session.delete(original)
        session.commit()
        status = sync_service.inspect_sync(session)
        assert status["conflicts"][0]["kind"] == "local_deleted"
        resolved = sync_service.reconcile_catalog(
            session,
            dry_run=False,
            decisions={problem_id: "use_incoming"},
            review_version=status["review_version"],
        )
        assert resolved["state"] == "clean"
        restored = session.get(Problem, problem_id)
        assert restored is not None
        delete_problem_search(session, problem_id)
        session.delete(restored)
        session.commit()

        replacement = Problem(
            source=source,
            source_key=source_key,
            slug="replacement",
            title="Local replacement",
            difficulty="Medium",
            status="Open",
            primary_subtag_id=session.query(TaxonomyNode)
            .filter(TaxonomyNode.kind == "sub")
            .first()
            .id,
        )
        session.add(replacement)
        session.flush()
        sync_problem_search(session, replacement)
        session.commit()
        status = sync_service.inspect_sync(session)
        assert status["conflicts"][0]["kind"] == "identity_conflict"
        assert status["conflicts"][0]["related_local_id"] == replacement.id


def test_legacy_conflicts_remain_pending_across_no_op_starts(two_devices, monkeypatch):
    settings_a, engine_a, _settings_b, _engine_b, _exports = two_devices
    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        problem_id = first_problem_id(session)
        session.query(AppSetting).filter(AppSetting.key == BASELINE_KEY).delete()
        session.merge(AppSetting(key=LEGACY_MARKER_KEY, value="{}"))
        delete_problem_search(session, problem_id)
        session.delete(session.get(Problem, problem_id))
        session.commit()
        first = sync_service.reconcile_catalog(session, dry_run=False)
        second = sync_service.reconcile_catalog(session, dry_run=False)
        assert first["conflicts"][0]["kind"] == "legacy_missing_local"
        assert second["conflicts"][0]["kind"] == "legacy_missing_local"
        assert session.get(AppSetting, BASELINE_KEY) is None


def test_sync_lock_rejects_concurrent_operations(two_devices, monkeypatch):
    settings_a, engine_a, _settings_b, _engine_b, _exports = two_devices
    activate(monkeypatch, settings_a)
    with Session(engine_a) as session, sync_service.sync_operation():
        with pytest.raises(sync_service.SyncBusyError, match="already running"):
            sync_service.inspect_sync(session)


def test_duplicate_incoming_identity_is_rejected_before_writes(two_devices, monkeypatch):
    settings_a, engine_a, settings_b, engine_b, shared_exports = two_devices
    activate(monkeypatch, settings_b)
    with Session(engine_b) as session:
        second = Problem(
            source="leetcode",
            source_key="other",
            slug="other",
            title="Other problem",
            difficulty="Easy",
            status="Open",
            primary_subtag_id=session.query(TaxonomyNode)
            .filter(TaxonomyNode.kind == "sub")
            .first()
            .id,
        )
        session.add(second)
        session.flush()
        second_id = second.id
        sync_problem_search(session, second)
        session.commit()
        export_service.export_catalog(session)

    catalog_path = shared_exports / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    second_record = next(record for record in catalog["records"] if record["id"] == second_id)
    readme = shared_exports / second_record["path"] / "README.md"
    readme.write_text(
        readme.read_text(encoding="utf-8").replace("source_key: other", "source_key: sample"),
        encoding="utf-8",
    )
    second_record["markdown_sha256"] = hashlib.sha256(readme.read_bytes()).hexdigest()
    catalog_path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )

    activate(monkeypatch, settings_a)
    with Session(engine_a) as session:
        original_count = session.query(Problem).count()
        status = sync_service.inspect_sync(session)
        assert status["state"] == "invalid"
        assert "Duplicate export source identity" in status["validation_error"]
        assert session.query(Problem).count() == original_count


def test_publish_pull_restart_between_isolated_device_roots(tmp_path, monkeypatch):
    root_a = tmp_path / "checkout-a"
    root_b = tmp_path / "checkout-b"
    settings_a = device_settings(root_a, root_a / "exports", "state")
    settings_b = device_settings(root_b, root_b / "exports", "state")
    engine_a = build_device(settings_a)
    engine_b = build_device(settings_b)
    try:
        activate(monkeypatch, settings_a)
        with Session(engine_a) as session:
            subtag = session.query(TaxonomyNode).filter(TaxonomyNode.kind == "sub").first()
            problem = Problem(
                source="leetcode",
                source_key="cross-device",
                slug="cross-device",
                title="Cross-device algorithm",
                difficulty="Medium",
                status="Open",
                primary_subtag_id=subtag.id,
                python_code="def solve():\n    return 'v1'\n",
            )
            problem.note_bullets.append(
                NoteBullet(section="core_insight", position=0, text="Published on A")
            )
            session.add(problem)
            session.flush()
            problem_id = problem.id
            sync_problem_search(session, problem)
            session.commit()
            sync_service.prepare_export(session)

        shutil.copytree(settings_a.export_dir, settings_b.export_dir)
        activate(monkeypatch, settings_b)
        with Session(engine_b) as session:
            restarted = sync_service.reconcile_catalog(session, dry_run=False)
            assert restarted["applied"] == 1
            imported = load_problem(session, problem_id)
            assert imported.python_code.endswith("return 'v1'\n")
            assert imported.note_bullets[0].text == "Published on A"
            edit_title(session, problem_id, "Edited on device B")
            sync_service.prepare_export(session)

        shutil.rmtree(settings_a.export_dir)
        shutil.copytree(settings_b.export_dir, settings_a.export_dir)
        activate(monkeypatch, settings_a)
        with Session(engine_a) as session:
            restarted = sync_service.reconcile_catalog(session, dry_run=False)
            assert restarted["applied"] == 1
            assert load_problem(session, problem_id).title == "Edited on device B"
    finally:
        engine_a.dispose()
        engine_b.dispose()
