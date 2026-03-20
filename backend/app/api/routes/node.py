from __future__ import annotations

from fastapi import APIRouter, Response, status

from app.api.deps import NodeStoreDep
from app.schemas.node import NodeCreate, NodeOut

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.get("", response_model=list[NodeOut])
def list_nodes(store: NodeStoreDep) -> list[NodeOut]:
    return store.list()


@router.post("", response_model=NodeOut, status_code=status.HTTP_201_CREATED)
def create_node(body: NodeCreate, store: NodeStoreDep) -> NodeOut:
    return store.create(body)


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(node_id: str, store: NodeStoreDep) -> Response:
    store.delete(node_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
