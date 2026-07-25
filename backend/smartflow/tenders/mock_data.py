"""Sample public procurements for development and demo."""

from __future__ import annotations

from datetime import date, timedelta

_BASE = date(2026, 7, 25)
_DEADLINE = _BASE + timedelta(days=26)


def _proc(
    external_id: str,
    title: str,
    description: str,
    category: str,
    *,
    deadline: date | None = None,
) -> dict[str, str]:
    return {
        "external_id": external_id,
        "title": title,
        "description": description,
        "category": category,
        "publication_date": _BASE.isoformat(),
        "deadline": (deadline or _DEADLINE).isoformat(),
        "url": f"https://example.com/procurement/{external_id}",
    }


MOCK_PROCUREMENTS: list[dict[str, str]] = [
    _proc(
        "PROC-001",
        "Electrical installation works for office building",
        "Complete electrical installation and lighting system for a 5-storey office",
        "Construction",
    ),
    _proc(
        "PROC-002",
        "Office furniture procurement",
        "Supply of desks, chairs and office equipment for 120 workstations",
        "Furniture",
    ),
    _proc(
        "PROC-003",
        "HVAC system maintenance contract",
        "Annual maintenance of heating, ventilation and air conditioning units",
        "HVAC",
    ),
    _proc(
        "PROC-004",
        "Power distribution upgrade",
        "Upgrade of main power distribution panels and cabling",
        "Construction",
    ),
    _proc(
        "PROC-005",
        "Lighting retrofit — LED installation",
        "Replace fluorescent fixtures with LED lighting across warehouse",
        "Construction",
    ),
    _proc(
        "PROC-006",
        "Building renovation — facade works",
        "External facade insulation and finishing for public building",
        "Construction",
    ),
    _proc(
        "PROC-007",
        "Engineering consultancy for bridge project",
        "Structural engineering and design supervision services",
        "Engineering",
    ),
    _proc(
        "PROC-008",
        "Catering services for municipal events",
        "Provision of catering for conferences and public ceremonies",
        "Services",
    ),
    _proc(
        "PROC-009",
        "Low-voltage installation in school",
        "Data cabling, access control and CCTV low-voltage installation",
        "Construction",
    ),
    _proc(
        "PROC-010",
        "Supply of classroom furniture",
        "Desks, chairs and storage for primary school renovation",
        "Furniture",
    ),
    _proc(
        "PROC-011",
        "Solar panel installation on public roof",
        "Design and installation of photovoltaic system with grid connection",
        "Construction",
    ),
    _proc(
        "PROC-012",
        "Fire alarm system installation",
        "Supply and installation of fire detection and alarm system",
        "Construction",
    ),
    _proc(
        "PROC-013",
        "Road resurfacing works",
        "Asphalt resurfacing of urban road section",
        "Construction",
    ),
    _proc(
        "PROC-014",
        "IT hardware procurement",
        "Laptops, monitors and peripherals for municipal staff",
        "IT",
    ),
    _proc(
        "PROC-015",
        "Electrical engineering study",
        "Feasibility study for electrical grid reinforcement",
        "Engineering",
    ),
    _proc(
        "PROC-016",
        "Window replacement in hospital wing",
        "Supply and installation of energy-efficient windows",
        "Construction",
    ),
    _proc(
        "PROC-017",
        "Cleaning services contract",
        "Daily cleaning of administrative buildings for 24 months",
        "Services",
    ),
    _proc(
        "PROC-018",
        "Emergency power generator installation",
        "Diesel generator and automatic transfer switch installation",
        "Construction",
    ),
    _proc(
        "PROC-019",
        "Laboratory equipment procurement",
        "Analytical instruments for environmental testing lab",
        "IT",
    ),
    _proc(
        "PROC-020",
        "Interior fit-out for new office",
        "Partition walls, ceilings and flooring for open-plan office",
        "Construction",
    ),
    _proc(
        "PROC-021",
        "Street lighting maintenance",
        "Maintenance of public street lighting network",
        "Construction",
    ),
    _proc(
        "PROC-022",
        "Water pump station electrical works",
        "Electrical installation for municipal water pump station",
        "Construction",
    ),
    _proc(
        "PROC-023",
        "Archive digitization services",
        "Scanning and indexing of historical municipal records",
        "Services",
    ),
    _proc(
        "PROC-024",
        "Playground equipment supply",
        "Outdoor playground structures and safety surfacing",
        "Furniture",
    ),
    _proc(
        "PROC-025",
        "Smart metering installation pilot",
        "Pilot deployment of smart electricity meters in residential zone",
        "Construction",
    ),
]
