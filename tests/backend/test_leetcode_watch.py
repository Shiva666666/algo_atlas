from __future__ import annotations

import json
import sqlite3
import subprocess
import sys
from datetime import date, datetime, time, timedelta

import httpx
import pytest
from algo_atlas.integrations.leetcode_submissions import LeetCodeSubmissions, Submission, WatchError
from algo_atlas.integrations.leetcode_watch_files import read_json, watch_lock, write_json
from algo_atlas.leetcode_watch import main
from algo_atlas.persistence.leetcode_watch import catalog_identities
from algo_atlas.services.leetcode_watch import IST, check, finalize, load_state

TODAY = date(2026, 10, 13)


def submission(slug="two-sum", number="1", submission_id=10, timestamp=100):
    return Submission(
        id=submission_id,
        timestamp=timestamp,
        slug=slug,
        number=number,
        title=slug.replace("-", " ").title(),
        language="python3",
        code="def solve(nums):\n    return len(nums)\n",
        difficulty="Easy",
        tags=["Array"],
    )


@pytest.fixture
def database(tmp_path):
    path = tmp_path / "catalog.db"
    with sqlite3.connect(path) as connection:
        connection.execute("CREATE TABLE problems (source, source_key, slug, url)")
        connection.executemany(
            "INSERT INTO problems VALUES (?, ?, ?, ?)",
            [
                ("leetcode", "1", "different-slug", None),
                (
                    "LeetCode",
                    "other",
                    "other",
                    "https://leetcode.com/problems/add-two-numbers/?x=1",
                ),
                ("lintcode", "three-sum", "three-sum", None),
            ],
        )
    return path


class FakeAPI:
    def __init__(self, submissions, account="my-account"):
        self.submissions = submissions
        self.username = account

    def account(self):
        return self.username

    def latest_solved(self, **kwargs):
        return self.submissions


def make_draft(directory):
    packet = read_json(directory / "plan-input.json")
    plans = []
    for item in packet["problems"]:
        plans.append(
            {
                "slug": item["slug"],
                "submission_id": item["id"],
                "approach": "Read the length without visiting elements.",
                "time_complexity": "O(1), Python list length is stored.",
                "space_complexity": "O(1), no copied collection.",
                "invariants": ["Input is unchanged."],
                "existing_lesson": "No existing matching lesson in this test fixture.",
                "diagram": "SequenceStrip with array length annotation.",
                "trace_states": ["Input", "Return length"],
                "source_focus": [{"line": 2, "meaning": "Return stored length."}],
                "presets": ["Empty array returns zero.", "Three elements return three."],
                "input_limits": "0–12 integer elements.",
                "registration": f"Named lesson folder, register aliases {item['slug']} and {item['number']} once.",
                "verification": [
                    "Independent answer",
                    "Immutable snapshots",
                    "Keyboard and reduced motion",
                ],
                "reference_adaptation": "Preserve exact Python source as reference; never execute it.",
            }
        )
    path = directory / "draft.json"
    write_json(path, {"fingerprint": packet["fingerprint"], "problems": plans})
    return path


def test_readonly_matching_and_no_db_creation(database, tmp_path):
    before = database.read_bytes()
    identities = catalog_identities(database)
    assert "1" in identities and "add-two-numbers" in identities
    assert "three-sum" not in identities
    assert database.read_bytes() == before
    missing = tmp_path / "missing.db"
    with pytest.raises(sqlite3.OperationalError):
        catalog_identities(missing)
    assert not missing.exists()


def test_collection_refresh_recheck_and_timing(database, tmp_path):
    directory = tmp_path / "watch"
    before = database.read_bytes()
    missing = submission("three-sum", "15")
    api = FakeAPI([submission(), submission("add-two-numbers", "2"), missing])
    result = check(api, database, directory, TODAY)
    assert result["status"] == "plan_due" and result["queued_problems"] == 1
    assert result["next_plan"] == "2026-10-13"
    api.submissions[-1] = submission("three-sum", "15", 11, 101)
    check(api, database, directory, TODAY + timedelta(days=1))
    assert load_state(directory).pending["three-sum"].id == 11
    assert check(api, database, directory, TODAY + timedelta(days=2))["status"] == "plan_due"
    result = check(api, database, directory, TODAY + timedelta(days=3))
    assert result["status"] == "plan_due"
    assert database.read_bytes() == before


def test_account_failure_preserves_state(database, tmp_path):
    directory = tmp_path / "watch"
    api = FakeAPI([submission("three-sum", "15")])
    check(api, database, directory, TODAY)
    before = (directory / "state.json").read_bytes()
    with pytest.raises(WatchError, match="account differs"):
        check(FakeAPI([], "different-account"), database, directory, TODAY)
    assert (directory / "state.json").read_bytes() == before
    with pytest.raises(WatchError, match="database is unavailable"):
        check(api, tmp_path / "absent.db", directory, TODAY)
    assert (directory / "state.json").read_bytes() == before


def test_publish_overdue_plan_and_no_repeat(database, tmp_path):
    directory = tmp_path / "watch"
    api = FakeAPI([submission("three-sum", "15")])
    check(api, database, directory, TODAY)
    later = TODAY + timedelta(days=10)
    check(api, database, directory, later)
    result = finalize(database, directory, make_draft(directory), later)
    assert result["status"] == "plan_ready" and result["planned_problems"] == 1
    state = load_state(directory)
    assert state.next_plan == later + timedelta(days=1) and state.planned == ["three-sum"]
    report = (directory / "plans" / f"{later.isoformat()}.md").read_text(encoding="utf-8")
    assert "Line 2" in report and "Implementation batch 1" in report
    assert "three-sum" in report and "Source focus" in report
    archive = read_json(directory / "plans" / f"{later.isoformat()}.json")
    assert archive["submissions"][0]["code"] == api.submissions[0].code
    assert check(api, database, directory, later + timedelta(days=3))["queued_problems"] == 0
    assert len(list((directory / "plans").glob("*.md"))) == 1


def test_database_rechecked_before_report(database, tmp_path):
    directory = tmp_path / "watch"
    api = FakeAPI([submission("three-sum", "15")])
    check(api, database, directory, TODAY)
    due = TODAY + timedelta(days=3)
    check(api, database, directory, due)
    draft = make_draft(directory)
    with sqlite3.connect(database) as connection:
        connection.execute("INSERT INTO problems VALUES ('leetcode', '15', 'three-sum', NULL)")
    result = finalize(database, directory, draft, due)
    assert result["status"] == "quiet" and not (directory / "plans").exists()


@pytest.mark.parametrize("fault", ["duplicate", "missing", "wrong_id", "bad_focus", "stale"])
def test_invalid_draft_keeps_queue(database, tmp_path, fault):
    directory = tmp_path / "watch"
    api = FakeAPI([submission("three-sum", "15")])
    check(api, database, directory, TODAY)
    due = TODAY + timedelta(days=3)
    check(api, database, directory, due)
    path = make_draft(directory)
    draft = read_json(path)
    if fault == "duplicate":
        draft["problems"].append(draft["problems"][0])
    elif fault == "missing":
        draft["problems"] = []
    elif fault == "wrong_id":
        draft["problems"][0]["submission_id"] = 99
    elif fault == "bad_focus":
        draft["problems"][0]["source_focus"][0]["line"] = 99
    else:
        draft["fingerprint"] = "outdated"
    write_json(path, draft)
    before = (directory / "state.json").read_bytes()
    with pytest.raises(WatchError):
        finalize(database, directory, path, due)
    assert (directory / "state.json").read_bytes() == before


def test_corrupt_state_and_process_lock(tmp_path):
    write_json(tmp_path / "state.json", {"bad": True})
    with pytest.raises(WatchError, match="state is invalid"):
        load_state(tmp_path)
    with watch_lock(tmp_path):
        with pytest.raises(WatchError, match="run is active"):
            with watch_lock(tmp_path):
                pytest.fail("Lock must not be reentered")
    with watch_lock(tmp_path):
        pass


def test_http_pagination_duplicates_failures_and_exact_code():
    offsets = []
    ids = []

    def handler(request):
        payload = json.loads(request.content)
        variables = payload["variables"]
        if "offset" in variables:
            offsets.append(variables["offset"])
            rows = (
                [
                    {
                        "id": "40",
                        "timestamp": "400",
                        "titleSlug": "ignored",
                        "statusDisplay": "Wrong Answer",
                    },
                    {
                        "id": "30",
                        "timestamp": "300",
                        "titleSlug": "problem-one",
                        "statusDisplay": "Accepted",
                    },
                    {
                        "id": "20",
                        "timestamp": "200",
                        "titleSlug": "problem-one",
                        "statusDisplay": "Accepted",
                    },
                ]
                if variables["offset"] == 0
                else [
                    {
                        "id": "10",
                        "timestamp": "100",
                        "titleSlug": "problem-two",
                        "statusDisplay": "Accepted",
                    }
                ]
            )
            data = {"submissionList": {"hasNext": variables["offset"] == 0, "submissions": rows}}
        elif "id" in variables:
            ids.append(variables["id"])
            slug = "problem-one" if variables["id"] == 30 else "problem-two"
            data = {
                "submissionDetails": {
                    "id": str(variables["id"]),
                    "timestamp": 100,
                    "statusCode": 10,
                    "code": "exact code\n",
                    "lang": {"name": "cpp"},
                    "question": {"titleSlug": slug},
                }
            }
        else:
            data = {
                "question": {
                    "questionFrontendId": "42",
                    "title": "Example",
                    "titleSlug": variables["slug"],
                    "difficulty": "Medium",
                    "topicTags": [],
                }
            }
        return httpx.Response(200, json={"data": data})

    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        api = LeetCodeSubmissions(client, "SESSION_SECRET", "CSRF_SECRET", sleep=lambda _: None)
        selected = api.latest_solved()
    assert offsets == [0, 20] and ids == [30, 10]
    assert len(selected) == 2 and selected[0].code == "exact code\n"


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(401),
        httpx.Response(403),
        httpx.Response(429),
        httpx.Response(500),
        httpx.Response(200, json={"errors": [{"message": "SESSION_SECRET CSRF_SECRET"}]}),
        httpx.Response(200, text="SESSION_SECRET CSRF_SECRET"),
        httpx.Response(200, json={"data": {"userStatus": {"isSignedIn": False}}}),
    ],
)
def test_remote_errors_never_leak_secrets(response):
    with httpx.Client(transport=httpx.MockTransport(lambda _: response)) as client:
        api = LeetCodeSubmissions(client, "SESSION_SECRET", "CSRF_SECRET", sleep=lambda _: None)
        with pytest.raises(WatchError) as error:
            api.account()
    assert "SESSION_SECRET" not in str(error.value) and "CSRF_SECRET" not in str(error.value)


def test_scan_limit_and_empty_incomplete_page():
    for rows in (
        [],
        [{"id": "1", "timestamp": "1", "titleSlug": "one", "statusDisplay": "Wrong Answer"}],
    ):
        with httpx.Client(
            transport=httpx.MockTransport(
                lambda _: httpx.Response(
                    200, json={"data": {"submissionList": {"hasNext": True, "submissions": rows}}}
                )
            )
        ) as client:
            api = LeetCodeSubmissions(client, "SESSION_SECRET", "CSRF_SECRET", sleep=lambda _: None)
            with pytest.raises(WatchError, match="incomplete|scan reached"):
                api.latest_solved(max_pages=1)


def test_cli_missing_credentials_and_safe_status(tmp_path, capsys):
    directory = tmp_path / "watch"
    assert main(["check", "--directory", str(directory)]) == 1
    assert json.loads(capsys.readouterr().out)["status"] == "action_required"
    write_json(directory / "credentials.json", {"session": "SESSION_SECRET", "csrf": "CSRF_SECRET"})
    assert main(["status", "--directory", str(directory)]) == 0
    output = capsys.readouterr().out
    assert "SESSION_SECRET" not in output and "CSRF_SECRET" not in output


def test_cli_import_does_not_initialize_app():
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import sys; import algo_atlas.leetcode_watch; assert 'algo_atlas.db' not in sys.modules; assert 'algo_atlas.main' not in sys.modules",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr


def test_newest_eight_distinct_and_detail_failure():
    requested_ids = []

    def handler(request):
        payload = json.loads(request.content)
        values = payload["variables"]
        if "offset" in values:
            rows = [
                {
                    "id": str(index),
                    "timestamp": str(index),
                    "titleSlug": f"problem-{index}",
                    "statusDisplay": "Accepted",
                }
                for index in range(1, 10)
            ]
            data = {"submissionList": {"hasNext": False, "submissions": rows}}
        elif "id" in values:
            requested_ids.append(values["id"])
            data = {
                "submissionDetails": {
                    "id": values["id"],
                    "timestamp": values["id"],
                    "statusCode": 10,
                    "code": "not executable text",
                    "lang": {"name": "java"},
                    "question": {"titleSlug": f"problem-{values['id']}"},
                }
            }
        else:
            data = {
                "question": {
                    "questionFrontendId": "1",
                    "title": "Problem",
                    "titleSlug": values["slug"],
                    "difficulty": "Easy",
                    "topicTags": [],
                }
            }
        return httpx.Response(200, json={"data": data})

    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        api = LeetCodeSubmissions(client, "SESSION_SECRET", "CSRF_SECRET", sleep=lambda _: None)
        assert len(api.latest_solved()) == 8
    assert requested_ids == list(range(9, 1, -1))


def test_collection_failure_preserves_all_state(database, tmp_path):
    class BrokenAPI(FakeAPI):
        def latest_solved(self, **kwargs):
            raise WatchError("Accepted submission code is unavailable. Queue preserved.")

    directory = tmp_path / "watch"
    check(FakeAPI([submission("three-sum", "15")]), database, directory, TODAY)
    before = (directory / "state.json").read_bytes()
    with pytest.raises(WatchError):
        check(BrokenAPI([]), database, directory, TODAY + timedelta(days=3))
    assert (directory / "state.json").read_bytes() == before
    assert read_json(directory / "plan-input.json")["problems"][0]["slug"] == "three-sum"


def test_report_batches_at_eight(database, tmp_path):
    directory = tmp_path / "watch"
    check(
        FakeAPI([submission(f"problem-{i}", str(i + 100), i + 1) for i in range(8)]),
        database,
        directory,
        TODAY,
    )
    due = TODAY + timedelta(days=3)
    check(FakeAPI([submission("problem-next", "200", 20)]), database, directory, due)
    finalize(database, directory, make_draft(directory), due)
    report = (directory / "plans" / f"{due.isoformat()}.md").read_text(encoding="utf-8")
    first, second = report.split("## Implementation batch 2")
    assert first.count("### ") == 8 and second.count("### ") == 1


def test_daily_report_first_check_next_day_and_no_repeat(database, tmp_path):
    directory = tmp_path / "watch"
    api = FakeAPI([submission("three-sum", "15")])
    assert check(api, database, directory, TODAY)["status"] == "plan_due"
    finalize(database, directory, make_draft(directory), TODAY)
    assert load_state(directory).next_plan == TODAY + timedelta(days=1)
    assert check(api, database, directory, TODAY)["status"] == "quiet"
    api.submissions = [submission("daily-new", "20", 30)]
    tomorrow = TODAY + timedelta(days=1)
    assert check(api, database, directory, tomorrow)["status"] == "plan_due"
    finalize(database, directory, make_draft(directory), tomorrow)
    assert len(list((directory / "plans").glob("*.md"))) == 2


def test_three_day_state_migrates_without_losing_queue(database, tmp_path):
    directory = tmp_path / "watch"
    api = FakeAPI([submission("three-sum", "15")])
    check(api, database, directory, TODAY)
    legacy = read_json(directory / "state.json")
    for field in ("cadence_days", "last_collection_at", "collection_start"):
        legacy.pop(field)
    legacy["next_plan"] = (TODAY + timedelta(days=3)).isoformat()
    write_json(directory / "state.json", legacy)
    api.submissions = []
    tomorrow = TODAY + timedelta(days=1)
    result = check(api, database, directory, tomorrow)
    state = load_state(directory)
    assert result["status"] == "plan_due" and state.cadence_days == 1
    assert state.next_plan == tomorrow and list(state.pending) == ["three-sum"]
    assert state.first_check == TODAY and state.planned == legacy["planned"]
    assert read_json(directory / "plan-input.json")["carryover_slugs"] == ["three-sum"]


def test_collection_window_uses_previous_evening_and_preserves_failed_cursor(database, tmp_path):
    class RecordingAPI(FakeAPI):
        def latest_solved(self, **kwargs):
            self.options = kwargs
            return self.submissions

    directory = tmp_path / "watch"
    api = RecordingAPI([])
    first = datetime.combine(TODAY, time(19), tzinfo=IST)
    check(api, database, directory, TODAY, now=first)
    assert api.options["since"] == int(datetime.combine(TODAY, time.min, tzinfo=IST).timestamp())
    next_evening = first + timedelta(days=1)
    api.submissions = [
        submission("after-seven", "99", timestamp=int((first + timedelta(hours=2)).timestamp()))
    ]
    result = check(api, database, directory, next_evening.date(), now=next_evening)
    assert result["status"] == "plan_due"
    assert api.options == {
        "count": None,
        "since": int(first.timestamp()),
        "until": int(next_evening.timestamp()),
    }
    cursor = load_state(directory).last_collection_at
    with pytest.raises(WatchError):
        check(api, tmp_path / "missing.db", directory, next_evening.date(), now=next_evening)
    assert load_state(directory).last_collection_at == cursor


def test_all_solves_in_window_paginate_beyond_eight():
    rows = [
        {
            "id": str(i + 1),
            "timestamp": str(1025 - i),
            "titleSlug": f"problem-{i}",
            "statusDisplay": "Accepted",
        }
        for i in range(25)
    ]
    rows += [
        {"id": "50", "timestamp": "1100", "titleSlug": "future", "statusDisplay": "Accepted"},
        {"id": "51", "timestamp": "1010", "titleSlug": "problem-0", "statusDisplay": "Accepted"},
        {"id": "52", "timestamp": "1000", "titleSlug": "boundary", "statusDisplay": "Accepted"},
        {"id": "53", "timestamp": "999", "titleSlug": "too-old", "statusDisplay": "Accepted"},
        {"id": "54", "timestamp": "1024", "titleSlug": "failed", "statusDisplay": "Wrong Answer"},
    ]
    rows.sort(key=lambda row: int(row["timestamp"]), reverse=True)
    by_id = {int(row["id"]): row for row in rows}
    offsets = []

    def handler(request):
        values = json.loads(request.content)["variables"]
        if "offset" in values:
            offset = values["offset"]
            offsets.append(offset)
            data = {
                "submissionList": {
                    "hasNext": offset + 20 < len(rows),
                    "submissions": rows[offset : offset + 20],
                }
            }
        elif "id" in values:
            row = by_id[values["id"]]
            data = {
                "submissionDetails": {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "statusCode": 10,
                    "code": "source text",
                    "lang": {"name": "python3"},
                    "question": {"titleSlug": row["titleSlug"]},
                }
            }
        else:
            data = {
                "question": {
                    "questionFrontendId": "1",
                    "title": "Example",
                    "titleSlug": values["slug"],
                    "difficulty": "Easy",
                    "topicTags": [],
                }
            }
        return httpx.Response(200, json={"data": data})

    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        api = LeetCodeSubmissions(client, "SESSION_SECRET", "CSRF_SECRET", sleep=lambda _: None)
        selected = api.latest_solved(count=None, since=1000, until=1050)
    assert len(selected) == 26 and offsets == [0, 20]
    assert {item.id for item in selected} == set(range(1, 26)) | {52}


def test_daily_empty_window_does_not_make_an_empty_report(database, tmp_path):
    directory = tmp_path / "watch"
    result = check(FakeAPI([]), database, directory, TODAY)
    assert result["status"] == "quiet" and result["next_plan"] == "2026-10-14"
    assert not (directory / "plan-input.json").exists()
    assert not (directory / "plans").exists()
