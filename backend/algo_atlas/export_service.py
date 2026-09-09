from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from uuid import uuid4

import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import load_problem, taxonomy_to_dict
from .models import Problem, TaxonomyNode
from .serializers import problem_to_dict

SECTION_LABELS = {
    "why_missed": "Why I missed it",
    "recognition_signals": "Recognition signals",
    "core_insight": "Core insight",
    "approach": "Approach",
    "invariants": "Invariants",
    "edge_cases": "Edge cases",
    "follow_up": "Follow-up",
}

EXPORT_SCHEMA_VERSION = 1


class ExportValidationError(ValueError):
    """Raised when a tracked export cannot be restored safely."""


def _sha(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def _record_directory(record: dict) -> Path:
    raw_path = record.get("path")
    if not isinstance(raw_path, str) or not raw_path or "\\" in raw_path:
        raise ExportValidationError("Every export record must use a non-empty POSIX path.")
    relative = PurePosixPath(raw_path)
    if relative.is_absolute() or any(part in {"", ".", ".."} for part in relative.parts):
        raise ExportValidationError(f"Unsafe export path: {raw_path}")
    root = settings.export_dir.resolve()
    directory = (root / Path(*relative.parts)).resolve()
    if directory == root or root not in directory.parents:
        raise ExportValidationError(f"Export path escaped the workspace: {raw_path}")
    return directory


def validate_export_catalog() -> dict:
    """Load and validate the portable export before any database write occurs."""
    catalog_path = settings.export_dir / "catalog.json"
    if not catalog_path.is_file():
        raise FileNotFoundError("No export catalog found.")
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ExportValidationError(f"Export catalog is not valid JSON: {exc}") from exc
    if not isinstance(catalog, dict):
        raise ExportValidationError("Export catalog must be a JSON object.")
    if catalog.get("export_schema_version") != EXPORT_SCHEMA_VERSION:
        raise ExportValidationError(
            f"Unsupported export schema version: {catalog.get('export_schema_version')!r}. "
            f"Expected {EXPORT_SCHEMA_VERSION}."
        )
    records = catalog.get("records")
    if not isinstance(records, list):
        raise ExportValidationError("Export catalog records must be a list.")
    if catalog.get("record_count") != len(records):
        raise ExportValidationError("Export record_count does not match the records list.")
    seen_ids: set[str] = set()
    seen_paths: set[str] = set()
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            raise ExportValidationError(f"Export record {index} must be an object.")
        record_id = record.get("id")
        record_path = record.get("path")
        if not isinstance(record_id, str) or not record_id:
            raise ExportValidationError(f"Export record {index} is missing its id.")
        if record_id in seen_ids:
            raise ExportValidationError(f"Duplicate export record id: {record_id}")
        if not isinstance(record_path, str) or record_path in seen_paths:
            raise ExportValidationError(f"Duplicate or invalid export path: {record_path!r}")
        seen_ids.add(record_id)
        seen_paths.add(record_path)
        directory = _record_directory(record)
        for filename, hash_key in (("README.md", "markdown_sha256"), ("solution.py", "solution_sha256")):
            path = directory / filename
            expected_hash = record.get(hash_key)
            if not path.is_file():
                raise ExportValidationError(f"Missing export file: {record_path}/{filename}")
            if not isinstance(expected_hash, str) or not re.fullmatch(r"[0-9a-f]{64}", expected_hash):
                raise ExportValidationError(f"Invalid {hash_key} for {record_path}.")
            if _sha(path) != expected_hash:
                raise ExportValidationError(f"Hash mismatch for {record_path}/{filename}.")
        metadata, _notes = _parse_markdown(directory / "README.md")
        if metadata.get("export_schema_version") != EXPORT_SCHEMA_VERSION:
            raise ExportValidationError(f"Unsupported README schema for {record_path}.")
        if metadata.get("id") != record_id:
            raise ExportValidationError(f"README id does not match catalog record {record_id}.")
        for required in ("source", "source_key", "slug", "title", "difficulty", "status", "primary_subtag_id", "created_at", "updated_at"):
            if required not in metadata:
                raise ExportValidationError(f"README for {record_path} is missing {required}.")
    return catalog


def create_backup(keep: int = 14) -> Path | None:
    if not settings.database_path.exists():
        return None
    settings.backup_dir.mkdir(parents=True, exist_ok=True)
    target = settings.backup_dir / f"algo-atlas-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"
    source_connection = sqlite3.connect(settings.database_path)
    target_connection = sqlite3.connect(target)
    try:
        source_connection.backup(target_connection)
    finally:
        target_connection.close()
        source_connection.close()
    for old in sorted(settings.backup_dir.glob("algo-atlas-*.db"), reverse=True)[keep:]:
        old.unlink(missing_ok=True)
    return target


def _frontmatter(problem: dict) -> dict:
    return {
        "export_schema_version": EXPORT_SCHEMA_VERSION,
        "id": problem["id"],
        "source": problem["source"],
        "source_key": problem["source_key"],
        "slug": problem["slug"],
        "title": problem["title"],
        "url": problem["url"],
        "difficulty": problem["difficulty"],
        "status": problem["status"],
        "primary_subtag_id": problem["primary_subtag"]["id"],
        "primary_path": [problem["primary_main"]["slug"], problem["primary_subtag"]["slug"]],
        "taxonomy_ids": [node["id"] for node in problem["taxonomy"]],
        "time_complexity": problem["time_complexity"],
        "space_complexity": problem["space_complexity"],
        "created_at": problem["created_at"],
        "updated_at": problem["updated_at"],
        "mistake_events": [
            {
                "id": event["id"],
                "occurred_at": event["occurred_at"],
                "observation": event["observation"],
                "reason_ids": [reason["id"] for reason in event["reasons"]],
            }
            for event in sorted(problem["mistake_events"], key=lambda item: item["occurred_at"])
        ],
    }


def _markdown(problem: dict) -> str:
    yaml_text = yaml.safe_dump(_frontmatter(problem), sort_keys=False, allow_unicode=True, default_flow_style=False).strip()
    lines = ["---", yaml_text, "---", "", f"# {problem['title']}", ""]
    if problem["url"]:
        lines += [f"[Open on {problem['source'].title()}]({problem['url']})", ""]
    notes = problem.get("notes", {})
    for section, label in SECTION_LABELS.items():
        bullets = notes.get(section, [])
        if bullets:
            lines += [f"## {label}", ""]
            lines += [f"- {bullet}" for bullet in bullets]
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def _sync_export_tree_in_place(stage: Path) -> None:
    """Update a watched export directory without renaming the directory itself.

    Vite keeps a directory watcher on ``exports`` during local development. On
    Windows that watcher can prevent ``os.replace(exports, previous)`` even
    though individual files remain writable. Copying the staged tree in place
    keeps the watched directory identity stable and lets the normal file-level
    export flow continue.
    """
    settings.export_dir.mkdir(parents=True, exist_ok=True)
    expected_files: set[Path] = set()
    for source in stage.rglob("*"):
        relative = source.relative_to(stage)
        target = settings.export_dir / relative
        if source.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        expected_files.add(relative)

    for existing in settings.export_dir.rglob("*"):
        if existing.is_file() and existing.relative_to(settings.export_dir) not in expected_files:
            existing.unlink()
    for directory in sorted(
        (path for path in settings.export_dir.rglob("*") if path.is_dir()),
        key=lambda path: len(path.parts),
        reverse=True,
    ):
        try:
            directory.rmdir()
        except OSError:
            # Non-empty directories are expected when a child remains.
            pass


def export_catalog(session: Session) -> dict:
    stage = settings.local_dir / f"export-stage-{uuid4().hex}"
    stage.mkdir(parents=True, exist_ok=False)
    records = []
    try:
        problem_ids = session.scalars(select(Problem.id).order_by(Problem.title, Problem.id)).all()
        for problem_id in problem_ids:
            problem = load_problem(session, problem_id)
            if not problem or not problem.primary_subtag.parent:
                continue
            item = problem_to_dict(problem)
            relative = Path(item["primary_main"]["slug"]) / item["primary_subtag"]["slug"] / item["slug"]
            directory = stage / relative
            directory.mkdir(parents=True, exist_ok=True)
            markdown_path = directory / "README.md"
            solution_path = directory / "solution.py"
            markdown_path.write_text(_markdown(item), encoding="utf-8", newline="\n")
            solution = item["python_code"].replace("\r\n", "\n").rstrip() + "\n" if item["python_code"].strip() else "# Add your Python solution here.\n"
            solution_path.write_text(solution, encoding="utf-8", newline="\n")
            records.append({
                "id": item["id"], "title": item["title"], "path": relative.as_posix(),
                "markdown_sha256": _sha(markdown_path), "solution_sha256": _sha(solution_path),
            })
        taxonomy = [taxonomy_to_dict(node) for node in session.scalars(select(TaxonomyNode).order_by(TaxonomyNode.kind, TaxonomyNode.sort_order, TaxonomyNode.name)).all()]
        catalog = {
            "export_schema_version": EXPORT_SCHEMA_VERSION,
            "generated_at": None,
            "record_count": len(records),
            "taxonomy": taxonomy,
            "records": records,
        }
        (stage / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
        if settings.export_dir.parent.resolve() != settings.root_dir.resolve():
            raise RuntimeError("Export directory escaped the workspace")
        previous = settings.local_dir / "export-previous"
        if previous.exists():
            shutil.rmtree(previous)
        if settings.export_dir.exists():
            try:
                os.replace(settings.export_dir, previous)
            except PermissionError:
                # A running Vite watcher can lock the directory on Windows.
                # Keep the directory in place and update its files instead.
                _sync_export_tree_in_place(stage)
                return catalog
        try:
            os.replace(stage, settings.export_dir)
        except Exception:
            if previous.exists() and not settings.export_dir.exists():
                os.replace(previous, settings.export_dir)
            raise
        if previous.exists():
            shutil.rmtree(previous)
        return catalog
    finally:
        if stage.exists():
            shutil.rmtree(stage)


def _parse_markdown(path: Path) -> tuple[dict, dict[str, list[str]]]:
    text_value = path.read_text(encoding="utf-8")
    if not text_value.startswith("---\n") or "\n---\n" not in text_value[4:]:
        raise ValueError(f"Invalid frontmatter in {path}")
    yaml_text, body = text_value[4:].split("\n---\n", 1)
    metadata = yaml.safe_load(yaml_text) or {}
    notes: dict[str, list[str]] = {}
    reverse_labels = {label: section for section, label in SECTION_LABELS.items()}
    current: str | None = None
    for line in body.splitlines():
        if line.startswith("## "):
            current = reverse_labels.get(line[3:].strip())
        elif current and line.startswith("- "):
            notes.setdefault(current, []).append(line[2:].strip())
    return metadata, notes


def restore_catalog(session: Session, dry_run: bool = True, *, commit: bool = True) -> dict:
    """Compatibility wrapper for callers of the original restore API."""
    from .sync_service import reconcile_catalog

    return reconcile_catalog(session, dry_run=dry_run)
