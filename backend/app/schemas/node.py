from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ConnectionStatus(str, Enum):
    disconnected = "disconnected"
    connecting = "connecting"
    connected = "connected"


class NodeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    gateway_url: str | None = Field(
        default=None,
        max_length=2048,
        description="Optional OpenClaw Gateway URL for future linkage.",
    )


class NodeOut(BaseModel):
    id: str
    name: str
    gateway_url: str | None
    connection_status: ConnectionStatus
    created_at: str
