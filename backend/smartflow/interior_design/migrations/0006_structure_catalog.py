from decimal import Decimal

from django.db import migrations, models


def seed_structure_catalog(apps, schema_editor):
    StructureCategory = apps.get_model("interior_design", "StructureCategory")
    StructureCatalogItem = apps.get_model("interior_design", "StructureCatalogItem")

    seeds = [
        (
            "Walls",
            1,
            [
                ("WALL-001", "Interior wall", "wall", "0", "0.12", "2.70", "0", "#57534e"),
                ("WALL-002", "Thin partition", "wall", "0", "0.08", "2.70", "0", "#78716c"),
            ],
        ),
        (
            "Windows",
            2,
            [
                ("WIN-001", "Standard window", "window", "1.20", "0.12", "1.40", "0.90", "#7dd3fc"),
                ("WIN-002", "Wide window", "window", "1.80", "0.12", "1.50", "0.90", "#38bdf8"),
            ],
        ),
        (
            "Doors",
            3,
            [
                ("DR-001", "Standard door", "door", "0.90", "0.12", "2.10", "0", "#a8a29e"),
                ("DR-002", "Double door", "door", "1.60", "0.12", "2.10", "0", "#78716c"),
            ],
        ),
    ]

    for name, sort_order, items in seeds:
        category, _ = StructureCategory.objects.get_or_create(
            name=name,
            defaults={"sort_order": sort_order},
        )
        for ident, item_name, part_type, w, d, h, elev, color in items:
            StructureCatalogItem.objects.get_or_create(
                category=category,
                identifier=ident,
                defaults={
                    "name": item_name,
                    "part_type": part_type,
                    "width": Decimal(w),
                    "depth": Decimal(d),
                    "height": Decimal(h),
                    "elevation": Decimal(elev),
                    "color": color,
                    "is_active": True,
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ("interior_design", "0005_electrical_vertical_mount"),
    ]

    operations = [
        migrations.CreateModel(
            name="StructureCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={
                "verbose_name_plural": "structure categories",
                "ordering": ["sort_order", "name"],
            },
        ),
        migrations.CreateModel(
            name="StructureCatalogItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("identifier", models.CharField(help_text="Unique code, e.g. WALL-001", max_length=64)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "part_type",
                    models.CharField(
                        choices=[("wall", "Wall"), ("window", "Window"), ("door", "Door")],
                        default="wall",
                        max_length=10,
                    ),
                ),
                (
                    "width",
                    models.DecimalField(
                        decimal_places=2,
                        default=1,
                        help_text="Opening width on plan (m); ignored for drawn walls.",
                        max_digits=6,
                    ),
                ),
                (
                    "depth",
                    models.DecimalField(
                        decimal_places=2,
                        default=0.12,
                        help_text="Wall/window/door thickness on plan (m).",
                        max_digits=6,
                    ),
                ),
                (
                    "height",
                    models.DecimalField(
                        decimal_places=2,
                        default=2.7,
                        help_text="Height in 3D (m).",
                        max_digits=6,
                    ),
                ),
                (
                    "elevation",
                    models.DecimalField(
                        decimal_places=2,
                        default=0,
                        help_text="Bottom height from floor (m) — sill for windows, 0 for doors.",
                        max_digits=6,
                    ),
                ),
                ("color", models.CharField(default="#78716c", max_length=7)),
                (
                    "image",
                    models.FileField(
                        blank=True,
                        help_text="Plan symbol (PNG, JPG, SVG).",
                        null=True,
                        upload_to="structure/images/",
                    ),
                ),
                (
                    "cad_file",
                    models.FileField(
                        blank=True,
                        help_text="Optional CAD symbol (PDF, SVG, DWG).",
                        null=True,
                        upload_to="structure/cad/",
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="items",
                        to="interior_design.structurecategory",
                    ),
                ),
            ],
            options={
                "ordering": ["category__sort_order", "category__name", "identifier"],
                "unique_together": {("category", "identifier")},
            },
        ),
        migrations.RunPython(seed_structure_catalog, migrations.RunPython.noop),
    ]
