from __future__ import annotations

from algo_atlas.integrations.exports import (
    ExportValidationError,
    parse_markdown,
    record_directory,
    validate_export_catalog,
)
from algo_atlas.services.sync.apply import _parse_datetime
from algo_atlas.services.sync.records import _canonical_record


def _incoming_records(settings) -> tuple[dict, dict[str, dict]]:
    catalog = validate_export_catalog()
    taxonomy = catalog.get("taxonomy")
    if not isinstance(taxonomy, list):
        raise ExportValidationError("Export taxonomy must be a list.")
    taxonomy_by_id: dict[str, dict] = {}
    seen_slugs: set[str] = set()
    for index, node in enumerate(taxonomy):
        if not isinstance(node, dict):
            raise ExportValidationError(f"Export taxonomy node {index} must be an object.")
        node_id = node.get("id")
        name = node.get("name")
        slug = node.get("slug")
        kind = node.get("kind")
        aliases = node.get("aliases")
        if not isinstance(node_id, str) or not node_id or node_id in taxonomy_by_id:
            raise ExportValidationError(f"Duplicate or invalid taxonomy id: {node_id!r}.")
        if not isinstance(name, str) or not name.strip() or len(name) > 120:
            raise ExportValidationError(f"Taxonomy node {node_id} has an invalid name.")
        if not isinstance(slug, str) or not slug or len(slug) > 140 or slug in seen_slugs:
            raise ExportValidationError(f"Taxonomy node {node_id} has a duplicate or invalid slug.")
        if kind not in {"main", "sub", "pattern", "failure", "custom"}:
            raise ExportValidationError(f"Taxonomy node {node_id} has an invalid kind.")
        if not isinstance(aliases, list) or any(not isinstance(alias, str) for alias in aliases):
            raise ExportValidationError(f"Taxonomy node {node_id} has invalid aliases.")
        taxonomy_by_id[node_id] = node
        seen_slugs.add(slug)
    for node_id, node in taxonomy_by_id.items():
        parent_id = node.get("parent_id")
        if parent_id is not None and not isinstance(parent_id, str):
            raise ExportValidationError(f"Taxonomy node {node_id} has an invalid parent id.")
        if parent_id is not None and parent_id not in taxonomy_by_id:
            raise ExportValidationError(f"Taxonomy node {node_id} has an unknown parent.")
        if node["kind"] == "sub" and (
            parent_id is None or taxonomy_by_id[parent_id]["kind"] != "main"
        ):
            raise ExportValidationError(f"Taxonomy sub-tag {node_id} must belong to a main family.")

    records: dict[str, dict] = {}
    seen_identities: set[tuple[str, str]] = set()
    seen_events: set[str] = set()
    for catalog_record in catalog["records"]:
        directory = record_directory(catalog_record)
        metadata, notes = parse_markdown(directory / "README.md")
        if not isinstance(metadata, dict):
            raise ExportValidationError(
                f"README metadata for {catalog_record['id']} must be an object."
            )
        metadata = dict(metadata)
        if not isinstance(metadata.get("taxonomy_ids"), list):
            raise ExportValidationError(
                f"Problem {catalog_record['id']} has invalid taxonomy links."
            )
        if not isinstance(metadata.get("mistake_events"), list):
            raise ExportValidationError(
                f"Problem {catalog_record['id']} has invalid mistake history."
            )
        for event in metadata["mistake_events"]:
            if not isinstance(event, dict) or not isinstance(event.get("reason_ids"), list):
                raise ExportValidationError(
                    f"Problem {catalog_record['id']} has an invalid mistake event."
                )
        metadata["notes"] = notes
        metadata["python_code"] = (directory / "solution.py").read_text(encoding="utf-8")
        record = _canonical_record(metadata)
        for key, maximum in (("source", 32), ("source_key", 180), ("slug", 180), ("title", 240)):
            value = record[key]
            if not isinstance(value, str) or not value.strip() or len(value) > maximum:
                raise ExportValidationError(f"Problem {record['id']} has an invalid {key}.")
        if record["url"] is not None and (
            not isinstance(record["url"], str) or len(record["url"]) > 500
        ):
            raise ExportValidationError(f"Problem {record['id']} has an invalid source URL.")
        if record["difficulty"] not in {"Easy", "Medium", "Hard"}:
            raise ExportValidationError(f"Problem {record['id']} has an invalid difficulty.")
        if record["status"] not in {"Open", "Understood", "Resolved"}:
            raise ExportValidationError(f"Problem {record['id']} has an invalid status.")
        if len(record["python_code"]) > 200_000:
            raise ExportValidationError(
                f"Problem {record['id']} has a solution larger than 200,000 characters."
            )
        if any(
            not isinstance(record[key], str) or len(record[key]) > 80
            for key in ("time_complexity", "space_complexity")
        ):
            raise ExportValidationError(f"Problem {record['id']} has invalid complexity metadata.")
        primary_id = record["primary_subtag_id"]
        if primary_id not in taxonomy_by_id or taxonomy_by_id[primary_id]["kind"] != "sub":
            raise ExportValidationError(f"Problem {record['id']} has an invalid primary sub-tag.")
        if any(taxonomy_id not in taxonomy_by_id for taxonomy_id in record["taxonomy_ids"]):
            raise ExportValidationError(f"Problem {record['id']} references unknown taxonomy.")
        for value, label in (
            (record["created_at"], "created_at"),
            (record["updated_at"], "updated_at"),
        ):
            try:
                _parse_datetime(value)
            except (TypeError, ValueError) as exc:
                raise ExportValidationError(
                    f"Problem {record['id']} has an invalid {label}."
                ) from exc
        identity = (record["source"], record["source_key"])
        if identity in seen_identities:
            raise ExportValidationError(
                f"Duplicate export source identity: {record['source']} / {record['source_key']}."
            )
        seen_identities.add(identity)
        for event in record["mistake_events"]:
            event_id = event["id"]
            if not isinstance(event_id, str) or not event_id or event_id in seen_events:
                raise ExportValidationError(
                    f"Problem {record['id']} has a duplicate or invalid mistake event id."
                )
            seen_events.add(event_id)
            try:
                _parse_datetime(event["occurred_at"])
            except (TypeError, ValueError) as exc:
                raise ExportValidationError(
                    f"Problem {record['id']} has an invalid mistake event date."
                ) from exc
            if not isinstance(event["observation"], str) or len(event["observation"]) > 2_000:
                raise ExportValidationError(
                    f"Problem {record['id']} has an invalid mistake observation."
                )
            if any(
                reason_id not in taxonomy_by_id or taxonomy_by_id[reason_id]["kind"] != "failure"
                for reason_id in event["reason_ids"]
            ):
                raise ExportValidationError(
                    f"Problem {record['id']} has an invalid mistake reason."
                )
        records[catalog_record["id"]] = record
    return catalog, records
