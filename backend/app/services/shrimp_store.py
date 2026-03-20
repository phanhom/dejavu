from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from fastapi import HTTPException

from app.schemas.shrimp import ConnectionStatus, ShrimpCreate, ShrimpOut


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ShrimpStore:
    """进程内虾列表（后续可换持久化 / 外部状态）。"""

    def __init__(self) -> None:
        self._rows: dict[str, dict] = {}
        self._lock = Lock()

    def list(self) -> list[ShrimpOut]:
        with self._lock:
            rows = sorted(
                self._rows.values(), key=lambda r: r["created_at"], reverse=True
            )
        return [ShrimpOut(**r) for r in rows]

    def create(self, body: ShrimpCreate) -> ShrimpOut:
        sid = str(uuid4())
        row = {
            "id": sid,
            "name": body.name.strip(),
            "gateway_url": body.gateway_url.strip() if body.gateway_url else None,
            "connection_status": ConnectionStatus.disconnected,
            "created_at": _now_iso(),
        }
        with self._lock:
            self._rows[sid] = row
        return ShrimpOut(**row)

    def delete(self, shrimp_id: str) -> None:
        with self._lock:
            if shrimp_id not in self._rows:
                raise HTTPException(status_code=404, detail="not found")
            del self._rows[shrimp_id]


shrimp_store = ShrimpStore()
