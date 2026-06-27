"""Rule-based layout suggestions for interior design prompts (MVP — no external API required)."""

from __future__ import annotations

import uuid
from typing import Any


FURNITURE_CATALOG: dict[str, dict[str, Any]] = {
    "sofa": {"label": "Sofa", "width": 2.0, "depth": 0.9, "height": 0.85, "color": "#64748b"},
    "desk": {"label": "Desk", "width": 1.4, "depth": 0.7, "height": 0.75, "color": "#92400e"},
    "chair": {"label": "Chair", "width": 0.5, "depth": 0.5, "height": 0.9, "color": "#475569"},
    "bed": {"label": "Bed", "width": 2.0, "depth": 1.6, "height": 0.5, "color": "#6366f1"},
    "table": {"label": "Dining table", "width": 1.6, "depth": 0.9, "height": 0.75, "color": "#78716c"},
    "plant": {"label": "Plant", "width": 0.4, "depth": 0.4, "height": 1.2, "color": "#16a34a"},
    "bookshelf": {"label": "Bookshelf", "width": 1.0, "depth": 0.35, "height": 1.8, "color": "#a16207"},
}


def default_layout() -> dict[str, Any]:
    return {
        "room": {"width": 8, "depth": 6, "height": 2.7},
        "furniture": [],
    }


def _merge_layout(existing: dict | None) -> dict[str, Any]:
    base = default_layout()
    if not existing or not isinstance(existing, dict):
        return base
    room = existing.get("room") or {}
    base["room"] = {
        "width": float(room.get("width", base["room"]["width"])),
        "depth": float(room.get("depth", base["room"]["depth"])),
        "height": float(room.get("height", base["room"]["height"])),
    }
    furniture = existing.get("furniture")
    if isinstance(furniture, list):
        base["furniture"] = list(furniture)
    return base


def _place_item(
    layout: dict,
    catalog: dict[str, dict[str, Any]],
    item_type: str,
    x: float,
    y: float,
    rotation: float = 0,
) -> None:
    spec = catalog.get(item_type)
    if not spec:
        for key, candidate in catalog.items():
            label = str(candidate.get("label", "")).lower()
            ident = str(candidate.get("identifier", key)).lower()
            if item_type in key or item_type in label or item_type in ident:
                spec = candidate
                item_type = key
                break
    if not spec:
        return
    layout["furniture"].append(
        {
            "id": str(uuid.uuid4()),
            "catalogItemId": spec.get("id"),
            "type": item_type,
            "identifier": spec.get("identifier"),
            "label": spec.get("label") or spec.get("name", item_type),
            "x": x,
            "y": y,
            "rotation": rotation,
            "width": spec["width"],
            "depth": spec["depth"],
            "height": spec["height"],
            "color": spec["color"],
        }
    )


def _catalog_has_type(furniture: list, item_type: str) -> bool:
    return any(
        item_type in str(f.get("type", ""))
        or item_type in str(f.get("label", "")).lower()
        or item_type in str(f.get("identifier", "")).lower()
        for f in furniture
    )


def generate_rule_based_suggestions(prompt: str, layout_data: dict | None) -> dict[str, Any]:
    """Fallback when LLM is unavailable — keyword-driven layout heuristics."""
    from .catalog_service import get_furniture_catalog

    catalog = get_furniture_catalog()
    text = (prompt or "").strip().lower()
    layout = _merge_layout(layout_data)
    suggestions: list[str] = []
    proposed = _merge_layout(layout)

    if any(w in text for w in ("office", "work", "study", "home office")):
        suggestions.extend(
            [
                "Place the desk near a window for natural light.",
                "Keep the chair facing away from the door to reduce distractions.",
                "Add a bookshelf within arm's reach of the desk.",
            ]
        )
        if not _catalog_has_type(proposed["furniture"], "desk"):
            _place_item(proposed, catalog, "desk", 1.0, 1.0)
            _place_item(proposed, catalog, "chair", 1.2, 2.0)
            _place_item(proposed, catalog, "bookshelf", 5.5, 0.5)

    elif any(w in text for w in ("bedroom", "sleep", "bed")):
        suggestions.extend(
            [
                "Position the bed against the longest wall for an open circulation path.",
                "Leave at least 60 cm clearance on both sides of the bed.",
                "Use soft lighting and minimal clutter for a restful atmosphere.",
            ]
        )
        if not _catalog_has_type(proposed["furniture"], "bed"):
            _place_item(proposed, catalog, "bed", 1.0, 1.0)
            _place_item(proposed, catalog, "plant", 6.0, 0.5)

    elif any(w in text for w in ("living", "lounge", "sofa", "tv")):
        suggestions.extend(
            [
                "Anchor the seating area with a sofa facing the main focal wall.",
                "Maintain clear paths between entry and seating (min 90 cm).",
                "Balance the room with a plant or accent piece opposite the sofa.",
            ]
        )
        if not _catalog_has_type(proposed["furniture"], "sofa"):
            _place_item(proposed, catalog, "sofa", 1.5, 2.0)
            _place_item(proposed, catalog, "table", 3.5, 2.5)
            _place_item(proposed, catalog, "plant", 6.5, 0.5)

    elif any(w in text for w in ("dining", "eat", "kitchen")):
        suggestions.extend(
            [
                "Center the dining table with equal clearance on all sides.",
                "Allow 60 cm per diner along the table edge.",
            ]
        )
        if not _catalog_has_type(proposed["furniture"], "table"):
            _place_item(proposed, catalog, "table", 2.5, 2.0, 0)
            for i in range(4):
                _place_item(proposed, catalog, "chair", 2.0 + i * 0.6, 1.2)

    else:
        suggestions.extend(
            [
                "Define zones: work, relax, and storage — even in open-plan spaces.",
                "Keep main walkways at least 90 cm wide.",
                "Use consistent materials and 2–3 accent colors for cohesion.",
            ]
        )

    if any(w in text for w in ("modern", "minimal", "minimalist", "clean")):
        suggestions.append("Favor fewer, larger furniture pieces and hidden storage.")
        proposed["style"] = {"theme": "modern_minimal"}

    if any(w in text for w in ("cozy", "warm", "scandinavian")):
        suggestions.append("Add textured textiles, warm wood tones, and layered lighting.")
        proposed["style"] = {"theme": "cozy_scandi"}

    if any(w in text for w in ("large", "spacious", "big")):
        proposed["room"]["width"] = max(proposed["room"]["width"], 10)
        proposed["room"]["depth"] = max(proposed["room"]["depth"], 8)
        suggestions.append("Expanded room dimensions to suit a larger footprint.")

    if any(w in text for w in ("small", "compact", "studio")):
        proposed["room"]["width"] = min(proposed["room"]["width"], 5)
        proposed["room"]["depth"] = min(proposed["room"]["depth"], 4)
        suggestions.append("Optimized layout for a compact studio footprint.")

    if not suggestions:
        suggestions.append("Describe the room type (office, bedroom, living) for tailored layout ideas.")

    return {
        "prompt": prompt,
        "suggestions": suggestions,
        "proposed_layout": proposed,
        "catalog": catalog,
        "source": "rules",
        "model": None,
    }


def generate_ai_suggestions(
    prompt: str,
    layout_data: dict | None,
    *,
    project_description: str = "",
) -> dict[str, Any]:
    """Try LLM first, then rule-based fallback."""
    from .llm_service import generate_layout_with_llm, is_llm_available

    if is_llm_available():
        llm_result = generate_layout_with_llm(
            prompt,
            layout_data,
            project_description=project_description,
        )
        if llm_result:
            return llm_result

    return generate_rule_based_suggestions(prompt, layout_data)
