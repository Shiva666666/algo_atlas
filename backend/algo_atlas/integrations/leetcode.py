from __future__ import annotations

import httpx


def fetch_metadata(problem_slug: str, url: str):
    query = """query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { questionId title titleSlug difficulty topicTags { name slug } } }"""
    warning = None
    data = None
    try:
        response = httpx.post(
            "https://leetcode.com/graphql",
            json={"query": query, "variables": {"titleSlug": problem_slug}},
            headers={"User-Agent": "AlgoAtlas/0.1", "Referer": url},
            timeout=6.0,
        )
        response.raise_for_status()
        data = response.json().get("data", {}).get("question")
    except Exception:
        warning = "LeetCode metadata is unavailable right now; the URL and inferred title are ready for manual entry."
    return data, warning
