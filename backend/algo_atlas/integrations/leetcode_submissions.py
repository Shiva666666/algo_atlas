"""Authenticated, read-only LeetCode requests. Never execute submitted code."""

from __future__ import annotations

import time
from collections.abc import Callable

import httpx
from pydantic import BaseModel, Field, ValidationError


class WatchError(Exception):
    """A safe message that may be shown without including remote response bodies."""


class Submission(BaseModel):
    id: int = Field(gt=0)
    timestamp: int = Field(ge=0)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    number: str = Field(min_length=1)
    title: str = Field(min_length=1)
    language: str = Field(min_length=1)
    code: str = Field(min_length=1)
    difficulty: str
    tags: list[str]


class LeetCodeSubmissions:
    def __init__(
        self,
        client: httpx.Client,
        session: str,
        csrf: str,
        *,
        sleep: Callable[[float], None] = time.sleep,
    ):
        if not session.strip() or not csrf.strip():
            raise WatchError("LeetCode credentials are missing. Run local setup.")
        if any(
            not value.isascii() or any(ord(c) < 33 or c == ";" for c in value)
            for value in (session, csrf)
        ):
            raise WatchError("Local cookie values are invalid. Run setup again.")
        self.client = client
        self.headers = {
            "Cookie": f"LEETCODE_SESSION={session}; csrftoken={csrf}",
            "x-csrftoken": csrf,
            "Referer": "https://leetcode.com/",
            "Content-Type": "application/json",
            "User-Agent": "AlgoAtlas/0.1",
        }
        self.sleep = sleep

    def query(self, query: str, variables: dict | None = None) -> dict:
        # Pace requests; stop on limits rather than repeatedly retrying unattended.
        self.sleep(0.6)
        try:
            response = self.client.post(
                "https://leetcode.com/graphql/",
                headers=self.headers,
                json={"query": query, "variables": variables or {}},
                timeout=20,
            )
        except httpx.HTTPError:
            raise WatchError("LeetCode network request failed. Queue preserved.") from None
        if response.status_code in (401, 403):
            raise WatchError(
                "LeetCode session expired or access was blocked. Refresh local cookies."
            )
        if response.status_code == 429:
            raise WatchError("LeetCode request limit reached. Retry at the next daily check.")
        if not response.is_success:
            raise WatchError("LeetCode is unavailable. Queue preserved.")
        try:
            body = response.json()
            if (
                not isinstance(body, dict)
                or body.get("errors")
                or not isinstance(body.get("data"), dict)
            ):
                raise ValueError
            return body["data"]
        except (ValueError, TypeError):
            raise WatchError("LeetCode returned an incomplete response. Queue preserved.") from None

    def account(self) -> str:
        data = self.query("query { userStatus { isSignedIn username } }")
        status = data.get("userStatus")
        if (
            not isinstance(status, dict)
            or not status.get("isSignedIn")
            or not isinstance(status.get("username"), str)
            or not status["username"].strip()
        ):
            raise WatchError("LeetCode session is not signed in. Refresh local cookies.")
        return status["username"]

    def latest_solved(
        self,
        *,
        count: int | None = 8,
        since: int | None = None,
        until: int | None = None,
        max_pages: int = 50,
    ) -> list[Submission]:
        selected: dict[str, dict] = {}
        exhausted = False
        for page in range(max_pages):
            data = self.query(
                """query($offset: Int!, $limit: Int!) {
                  submissionList(offset: $offset, limit: $limit) {
                    hasNext submissions { id timestamp titleSlug statusDisplay isPending }
                  }
                }""",
                {"offset": page * 20, "limit": 20},
            )
            listing = data.get("submissionList")
            if not isinstance(listing, dict) or not isinstance(listing.get("submissions"), list):
                raise WatchError("LeetCode submission history is unavailable. Queue preserved.")
            rows = listing["submissions"]
            try:
                # History is newest-first. Sort within pages for deterministic selection.
                for row in sorted(rows, key=lambda row: int(row["timestamp"]), reverse=True):
                    timestamp = int(row["timestamp"])
                    if since is not None and timestamp < since:
                        exhausted = True
                        break
                    if until is not None and timestamp > until:
                        continue
                    if row["statusDisplay"] != "Accepted":
                        continue
                    if row.get("isPending") not in (None, False, "Not Pending"):
                        continue
                    selected.setdefault(row["titleSlug"], row)
                    if count is not None and len(selected) == count:
                        break
            except (KeyError, TypeError, ValueError):
                raise WatchError(
                    "LeetCode submission history is malformed. Queue preserved."
                ) from None
            if exhausted or (count is not None and len(selected) == count):
                break
            if listing.get("hasNext") is False:
                exhausted = True
                break
            if listing.get("hasNext") is not True or not rows:
                raise WatchError("LeetCode pagination is incomplete. Queue preserved.")
        if not exhausted and (count is None or len(selected) < count):
            raise WatchError(
                "History scan reached the page limit before collection was complete. Queue preserved."
            )

        result = []
        for slug, row in selected.items():
            try:
                submission_id = int(row["id"])
                detail = self.query(
                    """query($id: Int!) { submissionDetails(submissionId: $id) {
                      id code timestamp statusCode lang { name }
                      question { titleSlug }
                    } }""",
                    {"id": submission_id},
                ).get("submissionDetails")
                question = self.query(
                    """query($slug: String!) { question(titleSlug: $slug) {
                      questionFrontendId title titleSlug difficulty topicTags { name }
                    } }""",
                    {"slug": slug},
                ).get("question")
                if (
                    not detail
                    or not question
                    or detail["statusCode"] != 10
                    or int(detail["id"]) != submission_id
                    or detail["question"]["titleSlug"] != slug
                    or question["titleSlug"] != slug
                ):
                    raise ValueError
                result.append(
                    Submission(
                        id=submission_id,
                        timestamp=int(detail["timestamp"]),
                        slug=slug,
                        number=question["questionFrontendId"],
                        title=question["title"],
                        language=detail["lang"]["name"],
                        code=detail["code"],
                        difficulty=question["difficulty"],
                        tags=[tag["name"] for tag in question["topicTags"]],
                    )
                )
            except (KeyError, TypeError, ValueError, ValidationError):
                raise WatchError(
                    "Accepted submission code or metadata is unavailable. Queue preserved."
                ) from None
        return result
