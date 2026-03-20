from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, node
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_title, version=settings.app_version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(node.router, prefix="/api")

    return app


app = create_app()
