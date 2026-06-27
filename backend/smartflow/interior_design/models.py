from django.conf import settings
from django.db import models


class FurnitureCategory(models.Model):
    """Group of catalog items (e.g. Tables, Seating)."""

    name = models.CharField(max_length=120, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "furniture categories"

    def __str__(self) -> str:
        return self.name


class FurnitureCatalogItem(models.Model):
    """Catalog product with dimensions, image, and optional CAD file."""

    category = models.ForeignKey(
        FurnitureCategory,
        on_delete=models.CASCADE,
        related_name="items",
    )
    identifier = models.CharField(
        max_length=64,
        help_text="Unique product code, e.g. TBL-001",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    width = models.DecimalField(max_digits=6, decimal_places=2, help_text="Width in meters")
    depth = models.DecimalField(max_digits=6, decimal_places=2, help_text="Depth in meters")
    height = models.DecimalField(max_digits=6, decimal_places=2, help_text="Height in meters")
    color = models.CharField(max_length=7, default="#64748b")
    image = models.FileField(
        upload_to="furniture/images/",
        blank=True,
        null=True,
        help_text="Product photo (PNG, JPG, WebP, SVG).",
    )
    cad_file = models.FileField(
        upload_to="furniture/cad/",
        blank=True,
        null=True,
        help_text="Optional CAD model or drawing.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category__sort_order", "category__name", "identifier"]
        unique_together = [("category", "identifier")]

    def __str__(self) -> str:
        return f"{self.identifier} — {self.name}"


class ElectricalCategory(models.Model):
    """Group of electrical catalog parts (e.g. Outlets, Wiring)."""

    name = models.CharField(max_length=120, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "electrical categories"

    def __str__(self) -> str:
        return self.name


class ElectricalCatalogItem(models.Model):
    """Electrical part for wire-plan layouts — dimensions plus electrical specs."""

    PART_OUTLET = "outlet"
    PART_SWITCH = "switch"
    PART_PANEL = "panel"
    PART_JUNCTION = "junction"
    PART_WIRE = "wire"
    PART_LIGHT = "light"
    PART_BREAKER = "breaker"
    PART_OTHER = "other"
    PART_TYPE_CHOICES = [
        (PART_OUTLET, "Outlet / socket"),
        (PART_SWITCH, "Switch"),
        (PART_PANEL, "Distribution panel"),
        (PART_JUNCTION, "Junction box"),
        (PART_WIRE, "Wire / cable run"),
        (PART_LIGHT, "Light fixture"),
        (PART_BREAKER, "Circuit breaker"),
        (PART_OTHER, "Other"),
    ]

    category = models.ForeignKey(
        ElectricalCategory,
        on_delete=models.CASCADE,
        related_name="items",
    )
    identifier = models.CharField(max_length=64, help_text="Unique part code, e.g. OUT-001")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    part_type = models.CharField(max_length=20, choices=PART_TYPE_CHOICES, default=PART_OUTLET)
    width = models.DecimalField(max_digits=6, decimal_places=2, help_text="Plan width in meters")
    depth = models.DecimalField(max_digits=6, decimal_places=2, help_text="Plan depth in meters")
    height = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text="Height / mounting height in meters (0 if N/A)",
    )
    color = models.CharField(max_length=7, default="#eab308")
    voltage_v = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Nominal voltage (V)",
    )
    amperage_a = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Current rating (A)",
    )
    wire_gauge_mm2 = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Wire cross-section (mm²)",
    )
    circuit_id = models.CharField(max_length=32, blank=True, help_text="Circuit label, e.g. C1")
    phases = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        help_text="Number of phases (1 or 3)",
    )
    MOUNT_FLOOR = "floor"
    MOUNT_CEILING = "ceiling"
    MOUNT_CUSTOM = "custom"
    VERTICAL_MOUNT_CHOICES = [
        (MOUNT_FLOOR, "On floor"),
        (MOUNT_CEILING, "On ceiling"),
        (MOUNT_CUSTOM, "Custom height"),
    ]
    vertical_mount = models.CharField(
        max_length=10,
        choices=VERTICAL_MOUNT_CHOICES,
        default=MOUNT_FLOOR,
        help_text="Default vertical placement in 3D (floor, ceiling, or custom height).",
    )
    mount_elevation = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Bottom edge height from floor (m) when vertical_mount is custom.",
    )
    image = models.FileField(
        upload_to="electrical/images/",
        blank=True,
        null=True,
        help_text="Symbol photo or diagram (PNG, JPG, SVG).",
    )
    cad_file = models.FileField(
        upload_to="electrical/cad/",
        blank=True,
        null=True,
        help_text="Optional CAD symbol or drawing.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category__sort_order", "category__name", "identifier"]
        unique_together = [("category", "identifier")]

    def __str__(self) -> str:
        return f"{self.identifier} — {self.name}"


class StructureCategory(models.Model):
    """Group of structure catalog items (Walls, Windows, Doors)."""

    name = models.CharField(max_length=120, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "structure categories"

    def __str__(self) -> str:
        return self.name


class StructureCatalogItem(models.Model):
    """Wall, window, or door for floor plans and 3D previews."""

    PART_WALL = "wall"
    PART_WINDOW = "window"
    PART_DOOR = "door"
    PART_TYPE_CHOICES = [
        (PART_WALL, "Wall"),
        (PART_WINDOW, "Window"),
        (PART_DOOR, "Door"),
    ]

    category = models.ForeignKey(
        StructureCategory,
        on_delete=models.CASCADE,
        related_name="items",
    )
    identifier = models.CharField(max_length=64, help_text="Unique code, e.g. WALL-001")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    part_type = models.CharField(max_length=10, choices=PART_TYPE_CHOICES, default=PART_WALL)
    width = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=1,
        help_text="Opening width on plan (m); ignored for drawn walls.",
    )
    depth = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0.12,
        help_text="Wall/window/door thickness on plan (m).",
    )
    height = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=2.7,
        help_text="Height in 3D (m).",
    )
    elevation = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text="Bottom height from floor (m) — sill for windows, 0 for doors.",
    )
    color = models.CharField(max_length=7, default="#78716c")
    image = models.FileField(
        upload_to="structure/images/",
        blank=True,
        null=True,
        help_text="Plan symbol (PNG, JPG, SVG).",
    )
    cad_file = models.FileField(
        upload_to="structure/cad/",
        blank=True,
        null=True,
        help_text="Optional CAD symbol (PDF, SVG, DWG).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category__sort_order", "category__name", "identifier"]
        unique_together = [("category", "identifier")]

    def __str__(self) -> str:
        return f"{self.identifier} — {self.name}"


class InteriorProject(models.Model):
    """Interior / CAD design project with floor plan, layout, and AI suggestions."""

    client_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    floorplan_file = models.FileField(upload_to="floorplans/", blank=True, null=True)
    cad_file = models.FileField(
        upload_to="cad_models/",
        blank=True,
        null=True,
        help_text="Optional CAD source file (DWG/DXF/PDF floor plan).",
    )
    style_preference = models.JSONField(default=dict, blank=True)
    layout_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Room dimensions and placed furniture items.",
    )
    ai_generated_images = models.JSONField(default=list, blank=True)
    ai_suggestions = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interior_projects",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]

    def __str__(self) -> str:
        return self.client_name
