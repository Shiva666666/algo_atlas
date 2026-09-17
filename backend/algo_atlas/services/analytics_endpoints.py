from __future__ import annotations

from sqlalchemy.orm import Session

from algo_atlas.services.analytics import analytics_overview, atlas_graph


def overview(*, session: Session) -> dict:
    return analytics_overview(session)


def atlas(*, session: Session) -> dict:
    return atlas_graph(session)
