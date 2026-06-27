"""Load furniture catalog from database with static fallback."""

from __future__ import annotations

from typing import Any

from .ai_helpers import FURNITURE_CATALOG as STATIC_CATALOG


def get_furniture_catalog() -> dict[str, dict[str, Any]]:
    """Flat slug-keyed catalog for AI helpers (identifier lowercased as key)."""
    try:
        from .models import FurnitureCatalogItem

        items = FurnitureCatalogItem.objects.filter(is_active=True).select_related("category")
        if not items.exists():
            return dict(STATIC_CATALOG)

        catalog: dict[str, dict[str, Any]] = {}
        for item in items:
            key = item.identifier.lower().replace(" ", "-")
            if key in catalog:
                key = f"{key}-{item.id}"
            catalog[key] = {
                "id": item.id,
                "identifier": item.identifier,
                "label": item.name,
                "width": float(item.width),
                "depth": float(item.depth),
                "height": float(item.height),
                "color": item.color,
                "category_id": item.category_id,
                "category_name": item.category.name,
            }
        return catalog
    except Exception:
        return dict(STATIC_CATALOG)


def get_grouped_furniture_catalog(request=None) -> list[dict[str, Any]]:
    """Categories with nested items for the design studio picker."""
    try:
        from .models import FurnitureCatalogItem, FurnitureCategory
        from .serializer import catalog_item_to_dict

        categories = FurnitureCategory.objects.prefetch_related("items").all()
        if not categories.exists():
            return _static_grouped_catalog()

        grouped: list[dict[str, Any]] = []
        for category in categories:
            active_items = [i for i in category.items.all() if i.is_active]
            if not active_items:
                continue
            grouped.append(
                {
                    "id": category.id,
                    "name": category.name,
                    "sort_order": category.sort_order,
                    "items": [_serialize_catalog_item(item, request) for item in active_items],
                }
            )
        return grouped or _static_grouped_catalog()
    except Exception:
        return _static_grouped_catalog()


def _serialize_catalog_item(item, request) -> dict[str, Any]:
    from .serializer import FurnitureCatalogItemSerializer

    return FurnitureCatalogItemSerializer(item, context={"request": request}).data


def _static_grouped_catalog() -> list[dict[str, Any]]:
    items = []
    for idx, (slug, spec) in enumerate(STATIC_CATALOG.items()):
        items.append(
            {
                "id": -(idx + 1),
                "category": 0,
                "category_name": "Default",
                "identifier": slug.upper(),
                "name": spec["label"],
                "description": "",
                "width": spec["width"],
                "depth": spec["depth"],
                "height": spec["height"],
                "color": spec["color"],
                "image_url": None,
                "cad_url": None,
                "is_active": True,
            }
        )
    return [{"id": 0, "name": "Default", "sort_order": 0, "items": items}]


def get_grouped_electrical_catalog(request=None) -> list[dict[str, Any]]:
    """Electrical categories with nested parts for the wire-plan picker."""
    try:
        from .models import ElectricalCategory
        from .serializer import ElectricalCatalogItemSerializer

        categories = ElectricalCategory.objects.prefetch_related("items").all()
        if not categories.exists():
            return _static_grouped_electrical_catalog()

        grouped: list[dict[str, Any]] = []
        for category in categories:
            active_items = [i for i in category.items.all() if i.is_active]
            if not active_items:
                continue
            grouped.append(
                {
                    "id": category.id,
                    "name": category.name,
                    "sort_order": category.sort_order,
                    "items": [
                        ElectricalCatalogItemSerializer(item, context={"request": request}).data
                        for item in active_items
                    ],
                }
            )
        return grouped or _static_grouped_electrical_catalog()
    except Exception:
        return _static_grouped_electrical_catalog()


def _static_grouped_electrical_catalog() -> list[dict[str, Any]]:
    defaults = [
        ("OUT-001", "Single outlet", "outlet", 0.08, 0.08, 0, "#eab308", 230, 16, None, "C1", 1),
        ("SW-001", "Light switch", "switch", 0.08, 0.08, 0, "#f59e0b", 230, 10, None, "C2", 1),
        ("PNL-001", "Distribution panel", "panel", 0.6, 0.25, 1.8, "#ca8a04", 400, 63, None, "MAIN", 3),
        ("WIR-001", "Cable run (2.5mm²)", "wire", 0.06, 1.0, 0, "#854d0e", 230, 16, 2.5, "C1", 1),
        ("LGT-001", "Ceiling light", "light", 0.2, 0.2, 0, "#fde047", 230, 6, 1.5, "C2", 1),
    ]
    items = []
    for idx, (ident, name, part_type, w, d, h, color, v, a, gauge, circuit, phases) in enumerate(defaults):
        items.append(
            {
                "id": -(idx + 1),
                "category": 0,
                "category_name": "Default",
                "identifier": ident,
                "name": name,
                "description": "",
                "part_type": part_type,
                "width": w,
                "depth": d,
                "height": h,
                "vertical_mount": "ceiling" if part_type == "light" else "custom" if part_type in ("switch", "outlet", "junction") else "floor",
                "mount_elevation": 1.1 if part_type == "switch" else 0.3 if part_type == "outlet" else 2.4 if part_type == "junction" else None,
                "color": color,
                "voltage_v": v,
                "amperage_a": a,
                "wire_gauge_mm2": gauge,
                "circuit_id": circuit,
                "phases": phases,
                "image_url": None,
                "cad_url": None,
                "is_active": True,
            }
        )
    return [{"id": 0, "name": "Default", "sort_order": 0, "items": items}]


def get_grouped_structure_catalog(request=None) -> list[dict[str, Any]]:
    """Structure categories (walls, windows, doors) for the design studio."""
    try:
        from .models import StructureCategory
        from .serializer import StructureCatalogItemSerializer

        categories = StructureCategory.objects.prefetch_related("items").all()
        if not categories.exists():
            return _static_grouped_structure_catalog()

        grouped: list[dict[str, Any]] = []
        for category in categories:
            active_items = [i for i in category.items.all() if i.is_active]
            if not active_items:
                continue
            grouped.append(
                {
                    "id": category.id,
                    "name": category.name,
                    "sort_order": category.sort_order,
                    "items": [
                        StructureCatalogItemSerializer(item, context={"request": request}).data
                        for item in active_items
                    ],
                }
            )
        return grouped or _static_grouped_structure_catalog()
    except Exception:
        return _static_grouped_structure_catalog()


def _static_grouped_structure_catalog() -> list[dict[str, Any]]:
    defaults = [
        ("WALL-001", "Interior wall", "wall", 0, 0.12, 2.7, 0, "#57534e"),
        ("WIN-001", "Standard window", "window", 1.2, 0.12, 1.4, 0.9, "#7dd3fc"),
        ("DR-001", "Standard door", "door", 0.9, 0.12, 2.1, 0, "#a8a29e"),
    ]
    items = []
    for idx, (ident, name, part_type, w, d, h, elev, color) in enumerate(defaults):
        items.append(
            {
                "id": -(idx + 1),
                "category": 0,
                "category_name": "Default",
                "identifier": ident,
                "name": name,
                "description": "",
                "part_type": part_type,
                "width": w,
                "depth": d,
                "height": h,
                "elevation": elev,
                "color": color,
                "image_url": None,
                "cad_url": None,
                "is_active": True,
            }
        )
    return [{"id": 0, "name": "Default", "sort_order": 0, "items": items}]
