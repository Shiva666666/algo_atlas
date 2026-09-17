import importlib.util
from pathlib import Path


def checker():
    path = Path(__file__).resolve().parents[2] / "scripts" / "check-architecture.py"
    spec = importlib.util.spec_from_file_location("architecture_checker", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.check_backend


def test_backend_architecture_rejects_reversed_layers_and_cycles(tmp_path):
    for layer in ("api", "services", "persistence"):
        (tmp_path / layer).mkdir()
    (tmp_path / "api" / "example.py").write_text("import algo_atlas.services.example\n")
    (tmp_path / "services" / "example.py").write_text("import algo_atlas.persistence.example\n")
    (tmp_path / "persistence" / "example.py").write_text("import algo_atlas.api.example\n")
    errors = checker()(tmp_path)
    assert any("persistence must not import" in error for error in errors)
    assert any("Dependency cycle" in error for error in errors)


def test_backend_architecture_allows_downward_dependencies(tmp_path):
    for layer in ("api", "services", "persistence", "integrations"):
        (tmp_path / layer).mkdir()
    (tmp_path / "api" / "example.py").write_text("import algo_atlas.services.example\n")
    (tmp_path / "services" / "example.py").write_text(
        "import algo_atlas.persistence.example\nimport algo_atlas.integrations.example\n"
    )
    (tmp_path / "persistence" / "example.py").write_text("import sqlalchemy\n")
    (tmp_path / "integrations" / "example.py").write_text("import json\n")
    assert checker()(tmp_path) == []
