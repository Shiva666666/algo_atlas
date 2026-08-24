from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def uid() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class TaxonomyNode(Base):
    __tablename__ = "taxonomy_nodes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, unique=True)
    kind: Mapped[str] = mapped_column(String(24), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(ForeignKey("taxonomy_nodes.id", ondelete="RESTRICT"))
    aliases_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    color: Mapped[str | None] = mapped_column(String(16))
    protected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    parent: Mapped["TaxonomyNode | None"] = relationship(remote_side=[id], back_populates="children")
    children: Mapped[list["TaxonomyNode"]] = relationship(back_populates="parent")


class Problem(Base):
    __tablename__ = "problems"
    __table_args__ = (
        UniqueConstraint("source", "source_key", name="uq_problems_source_key"),
        Index("idx_problems_primary_subtag", "primary_subtag_id"),
        Index("idx_problems_difficulty_status", "difficulty", "status"),
        Index("idx_problems_updated_at", "updated_at"),
        Index("idx_problems_open_status", "status", sqlite_where=text("status != 'Resolved'")),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    source: Mapped[str] = mapped_column(String(32), default="leetcode", nullable=False)
    source_key: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500))
    difficulty: Mapped[str] = mapped_column(String(16), default="Medium", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="Open", nullable=False)
    primary_subtag_id: Mapped[str] = mapped_column(ForeignKey("taxonomy_nodes.id", ondelete="RESTRICT"), nullable=False)
    python_code: Mapped[str] = mapped_column(Text, default="", nullable=False)
    time_complexity: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    space_complexity: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    primary_subtag: Mapped[TaxonomyNode] = relationship(foreign_keys=[primary_subtag_id])
    taxonomy_links: Mapped[list["ProblemTaxonomy"]] = relationship(back_populates="problem", cascade="all, delete-orphan")
    note_bullets: Mapped[list["NoteBullet"]] = relationship(back_populates="problem", cascade="all, delete-orphan")
    mistake_events: Mapped[list["MistakeEvent"]] = relationship(back_populates="problem", cascade="all, delete-orphan")


class ProblemTaxonomy(Base):
    __tablename__ = "problem_taxonomy"
    __table_args__ = (
        UniqueConstraint("problem_id", "taxonomy_id", name="uq_problem_taxonomy"),
        Index("idx_problem_taxonomy_taxonomy_problem", "taxonomy_id", "problem_id"),
    )
    problem_id: Mapped[str] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True)
    taxonomy_id: Mapped[str] = mapped_column(ForeignKey("taxonomy_nodes.id", ondelete="RESTRICT"), primary_key=True)
    role: Mapped[str] = mapped_column(String(24), default="pattern", nullable=False)
    problem: Mapped[Problem] = relationship(back_populates="taxonomy_links")
    taxonomy: Mapped[TaxonomyNode] = relationship()


class NoteBullet(Base):
    __tablename__ = "note_bullets"
    __table_args__ = (Index("idx_note_bullets_problem_section", "problem_id", "section", "position"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    problem_id: Mapped[str] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)
    section: Mapped[str] = mapped_column(String(48), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    problem: Mapped[Problem] = relationship(back_populates="note_bullets")


class MistakeEvent(Base):
    __tablename__ = "mistake_events"
    __table_args__ = (Index("idx_mistake_events_problem_occurred", "problem_id", "occurred_at"), Index("idx_mistake_events_occurred", "occurred_at"))
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    problem_id: Mapped[str] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    observation: Mapped[str] = mapped_column(Text, default="", nullable=False)
    problem: Mapped[Problem] = relationship(back_populates="mistake_events")
    reason_links: Mapped[list["MistakeEventReason"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class MistakeEventReason(Base):
    __tablename__ = "mistake_event_reasons"
    __table_args__ = (Index("idx_mistake_reason_taxonomy_event", "taxonomy_id", "event_id"),)
    event_id: Mapped[str] = mapped_column(ForeignKey("mistake_events.id", ondelete="CASCADE"), primary_key=True)
    taxonomy_id: Mapped[str] = mapped_column(ForeignKey("taxonomy_nodes.id", ondelete="RESTRICT"), primary_key=True)
    event: Mapped[MistakeEvent] = relationship(back_populates="reason_links")
    taxonomy: Mapped[TaxonomyNode] = relationship()


class AppSetting(Base):
    __tablename__ = "app_settings"
    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="", nullable=False)
