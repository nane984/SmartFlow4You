"""OpenAI-compatible LLM for interior layout suggestions."""

from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Any

from django.conf import settings

from .catalog_service import get_furniture_catalog
from .ai_helpers import _merge_layout

logger = logging.getLogger(__name__)


def _catalog() -> dict:
    return get_furniture_catalog()


ALLOWED_TYPES = frozenset()  # legacy; catalog is loaded dynamically


def is_llm_available() -> bool:
    return bool(getattr(settings, "OPENAI_API_KEY", ""))


def _extract_json(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    if not text:
        raise ValueError("Empty LLM response")
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("LLM response must be a JSON object")
    return data


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _normalize_llm_layout(raw: dict[str, Any], base_layout: dict[str, Any]) -> dict[str, Any]:
    catalog = _catalog()
    layout = _merge_layout(base_layout)
    room = raw.get("room") if isinstance(raw.get("room"), dict) else {}
    layout["room"] = {
        "width": _clamp(float(room.get("width", layout["room"]["width"])), 3, 24),
        "depth": _clamp(float(room.get("depth", layout["room"]["depth"])), 3, 24),
        "height": _clamp(float(room.get("height", layout["room"]["height"])), 2.2, 4.5),
    }
    style = raw.get("style")
    if isinstance(style, dict):
        layout["style"] = {str(k): str(v) for k, v in style.items()}

    furniture_in = raw.get("furniture")
    if not isinstance(furniture_in, list):
        furniture_in = []

    normalized: list[dict[str, Any]] = []
    rw = layout["room"]["width"]
    rd = layout["room"]["depth"]

    for item in furniture_in[:24]:
        if not isinstance(item, dict):
            continue
        item_type = str(item.get("type", "")).strip().lower()
        spec = catalog.get(item_type)
        if spec is None:
            for key, candidate in catalog.items():
                label = str(candidate.get("label", "")).lower()
                ident = str(candidate.get("identifier", key)).lower()
                if item_type == key or item_type in label or item_type in ident:
                    spec = candidate
                    item_type = key
                    break
        if spec is None:
            continue
        w = float(spec["width"])
        d = float(spec["depth"])
        max_x = max(0, rw - w)
        max_y = max(0, rd - d)
        x = _clamp(float(item.get("x", 0)), 0, max_x)
        y = _clamp(float(item.get("y", 0)), 0, max_y)
        rotation = int(float(item.get("rotation", 0))) % 360
        normalized.append(
            {
                "id": str(uuid.uuid4()),
                "catalogItemId": spec.get("id"),
                "type": item_type,
                "identifier": spec.get("identifier"),
                "label": spec.get("label") or spec.get("name", item_type),
                "x": round(x, 2),
                "y": round(y, 2),
                "rotation": rotation,
                "width": w,
                "depth": d,
                "height": float(spec["height"]),
                "color": spec["color"],
            }
        )

    layout["furniture"] = normalized
    return layout


def _build_messages(
    prompt: str,
    layout_data: dict | None,
    *,
    project_description: str = "",
) -> list[dict[str, str]]:
    current = _merge_layout(layout_data)
    catalog = _catalog()
    catalog_lines = "\n".join(
        f'- "{k}": {v.get("label", v.get("name", k))} ({v["width"]}m × {v["depth"]}m × {v["height"]}m)'
        for k, v in catalog.items()
    )
    context = json.dumps(current, indent=2)
    project_blurb = f"\nProject notes: {project_description}" if project_description else ""

    system = f"""You are an expert interior designer assistant. Given a user brief and optional current layout, respond with ONLY valid JSON (no markdown) using this schema:
{{
  "suggestions": ["string", "... at least 3 practical design tips"],
  "room": {{ "width": number, "depth": number, "height": number }},
  "style": {{ "theme": "short slug", "notes": "optional style summary" }},
  "furniture": [
    {{ "type": "<catalog_key>", "x": number, "y": number, "rotation": 0|90|180|270 }}
  ]
}}

Rules:
- Use only these furniture types:\n{catalog_lines}
- Coordinates x,y are meters from the room origin (top-left on floor plan). Keep every item fully inside the room bounds.
- Leave walkways ≥ 0.9m. Do not overlap furniture.
- Match the user's style, room type, and constraints. Prefer realistic counts (typically 3–8 items).
- Room width/depth in meters; typical height 2.7m unless user specifies otherwise."""

    user = f"""User request: {prompt}
{project_blurb}

Current layout JSON:
{context}

Produce an improved layout proposal and actionable suggestions."""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def generate_layout_with_llm(
    prompt: str,
    layout_data: dict | None,
    *,
    project_description: str = "",
) -> dict[str, Any] | None:
    """Call OpenAI Chat Completions; return normalized result dict or None on failure."""
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        return None

    model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
    base_url = getattr(settings, "OPENAI_BASE_URL", "") or None
    timeout = float(getattr(settings, "OPENAI_TIMEOUT_SECONDS", 60))

    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("openai package not installed; using rule-based suggestions")
        return None

    try:
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout)
        completion = client.chat.completions.create(
            model=model,
            temperature=0.4,
            response_format={"type": "json_object"},
            messages=_build_messages(
                prompt,
                layout_data,
                project_description=project_description,
            ),
        )
        content = completion.choices[0].message.content or ""
        parsed = _extract_json(content)
    except Exception as exc:
        logger.warning("Interior LLM request failed: %s", exc)
        return None

    suggestions = parsed.get("suggestions")
    if not isinstance(suggestions, list):
        suggestions = []
    suggestions = [str(s).strip() for s in suggestions if str(s).strip()][:12]
    if not suggestions:
        suggestions = ["Review the proposed furniture layout and adjust paths for circulation."]

    proposed = _normalize_llm_layout(parsed, layout_data)

    return {
        "prompt": prompt,
        "suggestions": suggestions,
        "proposed_layout": proposed,
        "catalog": catalog,
        "source": "llm",
        "model": model,
    }
