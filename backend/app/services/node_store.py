from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from fastapi import HTTPException

from app.schemas.node import ConnectionStatus, NodeCreate, NodeOut


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class NodeStore:
    """进程内已登记 OpenClaw 节点（后续可换持久化 / 外部状态）。"""

    def __init__(self) -> None:
        self._rows: dict[str, dict] = {}
        self._lock = Lock()

    def list(self) -> list[NodeOut]:
        with self._lock:
            rows = sorted(
                self._rows.values(), key=lambda r: r["created_at"], reverse=True
            )
        return [NodeOut(**r) for r in rows]

    def create(self, body: NodeCreate) -> NodeOut:
        nid = str(uuid4())
        row = {
            "id": nid,
            "name": body.name.strip(),
            "gateway_url": body.gateway_url.strip() if body.gateway_url else None,
            "connection_status": ConnectionStatus.disconnected,
            "created_at": _now_iso(),
        }
        with self._lock:
            self._rows[nid] = row
        return NodeOut(**row)

    def delete(self, node_id: str) -> None:
        with self._lock:
            if node_id not in self._rows:
                raise HTTPException(status_code=404, detail="not found")
            del self._rows[node_id]


node_store = NodeStore()
