"""Check backend layer direction and dependency cycles without third-party packages."""

import ast
from pathlib import Path


def check_backend(root: Path) -> list[str]:
    modules = {}
    for file in root.rglob("*.py"):
        relative = file.relative_to(root).with_suffix("")
        parts = list(relative.parts)
        if parts[-1] == "__init__":
            parts.pop()
        modules["algo_atlas" + ("." + ".".join(parts) if parts else "")] = file
    errors = []
    graph = {}
    for name, file in modules.items():
        package = name if file.name == "__init__.py" else name.rsplit(".", 1)[0]
        dependencies = []
        for node in ast.walk(ast.parse(file.read_text(encoding="utf-8"))):
            imports = []
            if isinstance(node, ast.Import):
                imports = [entry.name for entry in node.names]
            elif isinstance(node, ast.ImportFrom):
                base = node.module or ""
                if node.level:
                    prefix = package.split(".")[: len(package.split(".")) - node.level + 1]
                    base = ".".join(prefix + ([base] if base else []))
                imports = [
                    base + "." + entry.name if base + "." + entry.name in modules else base
                    for entry in node.names
                ]
            for target in imports:
                layer = name.split(".")[1] if "." in name else ""
                target_layer = target.split(".")[1] if target.startswith("algo_atlas.") else target
                forbidden = {
                    "api": {"integrations", "persistence"},
                    "services": {"api", "main", "fastapi"},
                    "persistence": {"api", "services", "integrations", "main", "bootstrap"},
                    "integrations": {"api", "services", "main", "bootstrap"},
                }
                if target_layer in forbidden.get(layer, set()):
                    errors.append(f"{name}: {layer} must not import {target}")
                if target in modules:
                    dependencies.append(target)
        graph[name] = dependencies
    visited, active = set(), []

    def visit(name):
        if name in active:
            errors.append("Dependency cycle: " + " -> ".join(active[active.index(name) :] + [name]))
            return
        if name in visited:
            return
        active.append(name)
        for dependency in graph.get(name, []):
            visit(dependency)
        active.pop()
        visited.add(name)

    for name in graph:
        visit(name)
    return errors


if __name__ == "__main__":
    issues = check_backend(Path("backend/algo_atlas"))
    if issues:
        raise SystemExit("\n".join(issues))
    print("Backend architecture: layer boundaries and dependency cycles passed.")
