from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    app_title: str = "逮虾户 API"
    app_version: str = "0.1.0"
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: (
            "http://localhost:22000",
            "http://127.0.0.1:22000",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        )
    )


settings = Settings()
