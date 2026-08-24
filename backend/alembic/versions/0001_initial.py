"""Initial normalized Algo Atlas schema.

Revision ID: 0001_initial
Revises: None
"""
from alembic import op
from algo_atlas.models import Base

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(op.get_bind())
    op.execute("CREATE VIRTUAL TABLE IF NOT EXISTS problem_search USING fts5(problem_id UNINDEXED, title, slug, notes, tags, python_code, tokenize='porter unicode61')")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS problem_search")
    Base.metadata.drop_all(op.get_bind())
