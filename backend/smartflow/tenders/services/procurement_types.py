"""Shared types and normalization for procurement import."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from django.utils import timezone


@dataclass
class RawProcurement:
    title: str
    description: str = ""
    external_id: str = ""
    reference_number: str = ""
    source_url: str = ""
    category: str = ""
    deadline: datetime | None = None
    publication_date: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


def parse_datetime(value: Any) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value if timezone.is_aware(value) else timezone.make_aware(value)
    text = str(value).strip()
    if not text:
        return None
    normalized = text.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalized)
        return dt if timezone.is_aware(dt) else timezone.make_aware(dt)
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(text, fmt)
            return timezone.make_aware(dt)
        except ValueError:
            continue
    return None


def normalize_record(raw: dict[str, Any]) -> RawProcurement | None:
    title = (
        raw.get("title")
        or raw.get("name")
        or raw.get("subject")
        or ""
    ).strip()
    if not title:
        return None
    return RawProcurement(
        title=title[:255],
        description=str(raw.get("description") or raw.get("summary") or "").strip(),
        external_id=str(raw.get("external_id") or raw.get("id") or "").strip(),
        reference_number=str(
            raw.get("reference_number")
            or raw.get("procurement_number")
            or raw.get("reference")
            or raw.get("number")
            or ""
        ).strip(),
        source_url=str(raw.get("source_url") or raw.get("url") or raw.get("link") or "").strip(),
        category=str(raw.get("category") or raw.get("type") or "").strip(),
        deadline=parse_datetime(raw.get("deadline") or raw.get("closing_date")),
        publication_date=parse_datetime(
            raw.get("publication_date") or raw.get("published_at") or raw.get("published")
        ),
        metadata={k: v for k, v in raw.items() if k not in {"title", "description"}},
    )


def extract_records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("results", "data", "items", "procurements", "tenders", "notices"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
        return [payload]
    return []
