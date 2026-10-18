"""Catalog identities without startup, initialization, or database writes."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from urllib.parse import urlsplit


def catalog_identities(database: Path) -> set[str]:
    connection = sqlite3.connect(database.resolve().as_uri() + "?mode=ro", uri=True, timeout=5)
    try:
        connection.execute("PRAGMA query_only=ON")
        rows = connection.execute(
            "SELECT source_key, slug, url FROM problems WHERE lower(source) = 'leetcode'"
        ).fetchall()
        identities = set()
        for source_key, slug, url in rows:
            identities.update(str(value).strip().lower() for value in (source_key, slug) if value)
            parsed = urlsplit(url or "")
            parts = parsed.path.strip("/").split("/")
            if (
                parsed.hostname in ("leetcode.com", "www.leetcode.com")
                and len(parts) >= 2
                and parts[0] == "problems"
            ):
                identities.add(parts[1].lower())
        return identities
    finally:
        connection.close()
