from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.services.shrimp_store import ShrimpStore, shrimp_store


def get_shrimp_store() -> ShrimpStore:
    return shrimp_store


ShrimpStoreDep = Annotated[ShrimpStore, Depends(get_shrimp_store)]
