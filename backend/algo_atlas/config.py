from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    root_dir: Path
    local_dir: Path
    database_path: Path
    backup_dir: Path
    export_dir: Path
    frontend_dist: Path


ROOT_DIR = Path(__file__).resolve().parents[2]
settings = Settings(
    root_dir=ROOT_DIR,
    local_dir=ROOT_DIR / ".local",
    database_path=ROOT_DIR / ".local" / "algo_atlas.db",
    backup_dir=ROOT_DIR / ".local" / "backups",
    export_dir=ROOT_DIR / "exports",
    frontend_dist=ROOT_DIR / "dist",
)


def ensure_local_dirs() -> None:
    settings.local_dir.mkdir(parents=True, exist_ok=True)
    settings.backup_dir.mkdir(parents=True, exist_ok=True)
