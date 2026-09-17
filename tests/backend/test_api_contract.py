import json
from pathlib import Path

from algo_atlas.main import app


def test_openapi_matches_pre_refactor_contract():
    expected = json.loads(
        (Path(__file__).parent / "fixtures/openapi.json").read_text(encoding="utf-8")
    )
    assert app.openapi() == expected
