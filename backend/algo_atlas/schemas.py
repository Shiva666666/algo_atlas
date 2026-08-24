from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator

Difficulty = Literal["Easy", "Medium", "Hard"]
ProblemStatus = Literal["Open", "Understood", "Resolved"]
NOTE_SECTIONS = ("why_missed", "recognition_signals", "core_insight", "approach", "invariants", "edge_cases", "follow_up")


class ProblemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    url: str | None = Field(default=None, max_length=500)
    source: str = Field(default="leetcode", max_length=32)
    source_key: str | None = Field(default=None, max_length=180)
    slug: str | None = Field(default=None, max_length=180)
    difficulty: Difficulty = "Medium"
    status: ProblemStatus = "Open"
    primary_subtag_id: str
    taxonomy_ids: list[str] = Field(default_factory=list, max_length=40)
    failure_reason_ids: list[str] = Field(default_factory=list, max_length=10)
    python_code: str = Field(default="", max_length=200_000)
    time_complexity: str = Field(default="", max_length=80)
    space_complexity: str = Field(default="", max_length=80)
    notes: dict[str, list[str]] = Field(default_factory=dict)
    occurred_at: datetime | None = None
    observation: str = Field(default="", max_length=2000)

    @field_validator("notes")
    @classmethod
    def valid_notes(cls, notes: dict[str, list[str]]) -> dict[str, list[str]]:
        unknown = set(notes) - set(NOTE_SECTIONS)
        if unknown:
            raise ValueError(f"Unknown note sections: {', '.join(sorted(unknown))}")
        cleaned: dict[str, list[str]] = {}
        for section, bullets in notes.items():
            cleaned[section] = [item.strip() for item in bullets if item.strip()][:30]
        return cleaned


class ProblemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    url: str | None = Field(default=None, max_length=500)
    difficulty: Difficulty | None = None
    status: ProblemStatus | None = None
    primary_subtag_id: str | None = None
    taxonomy_ids: list[str] | None = Field(default=None, max_length=40)
    python_code: str | None = Field(default=None, max_length=200_000)
    time_complexity: str | None = Field(default=None, max_length=80)
    space_complexity: str | None = Field(default=None, max_length=80)
    notes: dict[str, list[str]] | None = None

    @field_validator("notes")
    @classmethod
    def valid_notes(cls, notes: dict[str, list[str]] | None) -> dict[str, list[str]] | None:
        if notes is None:
            return None
        return ProblemCreate.valid_notes(notes)


class MistakeCreate(BaseModel):
    occurred_at: datetime | None = None
    reason_ids: list[str] = Field(default_factory=list, max_length=10)
    observation: str = Field(default="", max_length=2000)


class CustomTaxonomyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    parent_id: str | None = None
    aliases: list[str] = Field(default_factory=list, max_length=20)


class TaxonomyAliasUpdate(BaseModel):
    aliases: list[str] = Field(default_factory=list, max_length=20)


class LeetCodeImportRequest(BaseModel):
    url: str = Field(min_length=10, max_length=500)


class GitSettingsUpdate(BaseModel):
    remote_url: str | None = Field(default=None, max_length=500)
    branch: str = Field(default="main", pattern=r"^[A-Za-z0-9._/-]+$")
    user_name: str | None = Field(default=None, max_length=120)
    user_email: str | None = Field(default=None, max_length=240)


class RestoreRequest(BaseModel):
    dry_run: bool = True
