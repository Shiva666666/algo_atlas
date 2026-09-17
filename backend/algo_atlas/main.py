from __future__ import annotations

import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from algo_atlas.bootstrap import prepare_local_state
from algo_atlas.config import settings


@asynccontextmanager
async def lifespan(_app: FastAPI):
    prepare_local_state()
    yield


app = FastAPI(
    title="Algo Atlas",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


@app.middleware("http")
async def local_write_guard(request: Request, call_next):  # type: ignore[no-untyped-def]
    if request.method in {"POST", "PATCH", "PUT", "DELETE"} and request.url.path.startswith(
        "/api/"
    ):
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type:
            from fastapi.responses import JSONResponse

            return JSONResponse(
                {"detail": "State-changing requests must use JSON."}, status_code=415
            )
        origin = request.headers.get("origin")
        allowed = bool(origin and re.match(r"^http://(127\.0\.0\.1|localhost)(:\d+)?$", origin))
        marker = request.headers.get("x-algo-atlas") == "1"
        if not allowed or not marker:
            from fastapi.responses import JSONResponse

            return JSONResponse(
                {"detail": "Write request rejected: open Algo Atlas locally and retry."},
                status_code=403,
            )
    return await call_next(request)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "local": True, "version": app.version}


from fastapi.responses import JSONResponse

from algo_atlas.api import analytics, imports, problems, sync, taxonomy
from algo_atlas.services.errors import ServiceError


@app.exception_handler(ServiceError)
async def service_error(_request: Request, exc: ServiceError):
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


for router in (problems.router, taxonomy.router, analytics.router, imports.router, sync.router):
    app.include_router(router)

if (settings.frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=settings.frontend_dist / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str):  # type: ignore[no-untyped-def]
    requested = (settings.frontend_dist / full_path).resolve()
    if (
        settings.frontend_dist.exists()
        and requested.is_relative_to(settings.frontend_dist.resolve())
        and requested.is_file()
    ):
        response = FileResponse(requested)
        if requested.name == "index.html":
            response.headers["Cache-Control"] = "no-cache, must-revalidate"
        return response
    index = settings.frontend_dist / "index.html"
    if index.exists():
        response = FileResponse(index)
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
        return response
    raise HTTPException(404, "Frontend build not found. Run npm run build.")
