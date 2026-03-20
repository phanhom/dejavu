from __future__ import annotations

from fastapi import APIRouter, Response, status

from app.api.deps import ShrimpStoreDep
from app.schemas.shrimp import ShrimpCreate, ShrimpOut

router = APIRouter(prefix="/shrimp", tags=["shrimp"])


@router.get("", response_model=list[ShrimpOut])
def list_shrimp(store: ShrimpStoreDep) -> list[ShrimpOut]:
    return store.list()


@router.post("", response_model=ShrimpOut, status_code=status.HTTP_201_CREATED)
def create_shrimp(body: ShrimpCreate, store: ShrimpStoreDep) -> ShrimpOut:
    return store.create(body)


@router.delete("/{shrimp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shrimp(shrimp_id: str, store: ShrimpStoreDep) -> Response:
    store.delete(shrimp_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
