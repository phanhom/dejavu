from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.services.node_store import NodeStore, node_store


def get_node_store() -> NodeStore:
    return node_store


NodeStoreDep = Annotated[NodeStore, Depends(get_node_store)]
