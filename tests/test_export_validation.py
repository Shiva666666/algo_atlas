from __future__ import annotations

import json
import shutil
from dataclasses import replace

import pytest

from algo_atlas import export_service
from algo_atlas.config import settings as default_settings
from algo_atlas.export_service import ExportValidationError, validate_export_catalog


@pytest.fixture()
def tracked_export(tmp_path, monkeypatch):
    export_dir = tmp_path / "exports"
    shutil.copytree(default_settings.export_dir, export_dir)
    local_settings = replace(
        default_settings,
        root_dir=tmp_path,
        local_dir=tmp_path / ".local",
        database_path=tmp_path / ".local" / "algo_atlas.db",
        backup_dir=tmp_path / ".local" / "backups",
        export_dir=export_dir,
        frontend_dist=tmp_path / "dist",
    )
    monkeypatch.setattr(export_service, "settings", local_settings)
    return local_settings


def read_catalog(export_dir):
    return json.loads((export_dir / "catalog.json").read_text(encoding="utf-8"))


def write_catalog(export_dir, catalog):
    (export_dir / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8", newline="\n")


def test_tracked_catalog_is_valid(tracked_export):
    catalog = validate_export_catalog()
    assert catalog["record_count"] == len(catalog["records"])


def test_unsupported_schema_is_rejected(tracked_export):
    catalog = read_catalog(tracked_export.export_dir)
    catalog["export_schema_version"] = 999
    write_catalog(tracked_export.export_dir, catalog)
    with pytest.raises(ExportValidationError, match="Unsupported export schema"):
        validate_export_catalog()


def test_record_count_mismatch_is_rejected(tracked_export):
    catalog = read_catalog(tracked_export.export_dir)
    catalog["record_count"] += 1
    write_catalog(tracked_export.export_dir, catalog)
    with pytest.raises(ExportValidationError, match="record_count"):
        validate_export_catalog()


def test_path_escape_is_rejected(tracked_export):
    catalog = read_catalog(tracked_export.export_dir)
    catalog["records"][0]["path"] = "../outside"
    write_catalog(tracked_export.export_dir, catalog)
    with pytest.raises(ExportValidationError, match="Unsafe export path"):
        validate_export_catalog()


def test_missing_file_is_rejected(tracked_export):
    catalog = read_catalog(tracked_export.export_dir)
    record = catalog["records"][0]
    (tracked_export.export_dir / record["path"] / "solution.py").unlink()
    with pytest.raises(ExportValidationError, match="Missing export file"):
        validate_export_catalog()


def test_hash_mismatch_is_rejected(tracked_export):
    catalog = read_catalog(tracked_export.export_dir)
    record = catalog["records"][0]
    (tracked_export.export_dir / record["path"] / "solution.py").write_text("# changed\n", encoding="utf-8")
    with pytest.raises(ExportValidationError, match="Hash mismatch"):
        validate_export_catalog()


def test_corrupt_catalog_is_rejected(tracked_export):
    (tracked_export.export_dir / "catalog.json").write_text("{not-json", encoding="utf-8")
    with pytest.raises(ExportValidationError, match="not valid JSON"):
        validate_export_catalog()
