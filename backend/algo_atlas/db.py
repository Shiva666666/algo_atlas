from __future__ import annotations

import re
from collections.abc import Generator
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import Engine, create_engine, event, select, text
from sqlalchemy.orm import Session

from algo_atlas.config import ensure_local_dirs, settings
from algo_atlas.models import Base, TaxonomyNode
from algo_atlas.taxonomy_seed import FAILURE_REASONS, MAIN_FAMILIES, PATTERNS


def slugify(value: str) -> str:
    value = value.strip().lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:180] or "untitled"


def taxonomy_uid(slug: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"algo-atlas:taxonomy:{slug}"))


def build_engine(database_url: str | None = None) -> Engine:
    ensure_local_dirs()
    url = database_url or f"sqlite:///{settings.database_path.as_posix()}"
    engine = create_engine(url, connect_args={"check_same_thread": False}, future=True)

    @event.listens_for(engine, "connect")
    def set_sqlite_pragmas(dbapi_connection, _connection_record) -> None:  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

    return engine


engine = build_engine()


FTS_STATEMENTS = [
    """CREATE VIRTUAL TABLE IF NOT EXISTS problem_search USING fts5(
        problem_id UNINDEXED, title, slug, notes, tags, python_code,
        tokenize='porter unicode61'
    )""",
]


def init_db(target_engine: Engine = engine) -> None:
    Base.metadata.create_all(target_engine)
    with target_engine.begin() as conn:
        for statement in FTS_STATEMENTS:
            conn.execute(text(statement))
    with Session(target_engine) as session:
        seed_taxonomy(session)
        session.commit()
    with target_engine.begin() as conn:
        conn.execute(text("PRAGMA optimize"))


def seed_taxonomy(session: Session) -> None:
    nodes = session.scalars(select(TaxonomyNode)).all()
    by_slug = {node.slug: node for node in nodes}
    order = 0
    for main_slug, main_name, color, children in MAIN_FAMILIES:
        main = by_slug.get(main_slug)
        if not main:
            main = TaxonomyNode(
                id=taxonomy_uid(main_slug),
                name=main_name,
                slug=main_slug,
                kind="main",
                color=color,
                protected=True,
                sort_order=order,
            )
            session.add(main)
            session.flush()
            by_slug[main_slug] = main
        for child_order, child_name in enumerate(children):
            child_slug = slugify(child_name)
            child = by_slug.get(child_slug)
            if child and (child.kind != "sub" or child.parent_id != main.id):
                child_slug = f"{main_slug}-{child_slug}"
                child = by_slug.get(child_slug)
            if not child:
                child = TaxonomyNode(
                    id=taxonomy_uid(child_slug),
                    name=child_name,
                    slug=child_slug,
                    kind="sub",
                    parent_id=main.id,
                    color=color,
                    protected=True,
                    sort_order=child_order,
                )
                session.add(child)
                by_slug[child_slug] = child
        order += 1
    for pattern_order, name in enumerate(PATTERNS):
        node_slug = slugify(name)
        if node_slug not in by_slug:
            node = TaxonomyNode(
                id=taxonomy_uid(node_slug),
                name=name,
                slug=node_slug,
                kind="pattern",
                protected=True,
                sort_order=pattern_order,
            )
            session.add(node)
            by_slug[node_slug] = node
    for reason_order, name in enumerate(FAILURE_REASONS):
        node_slug = f"failure-{slugify(name)}"
        if node_slug not in by_slug:
            node = TaxonomyNode(
                id=taxonomy_uid(node_slug),
                name=name,
                slug=node_slug,
                kind="failure",
                protected=True,
                sort_order=reason_order,
            )
            session.add(node)
            by_slug[node_slug] = node


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
