from decimal import Decimal

from django.db import migrations, models


def seed_furniture_catalog(apps, schema_editor):
    FurnitureCategory = apps.get_model("interior_design", "FurnitureCategory")
    FurnitureCatalogItem = apps.get_model("interior_design", "FurnitureCatalogItem")

    seeds = [
        (
            "Seating",
            1,
            [
                ("CHAIR-001", "Chair", "0.50", "0.50", "0.90", "#475569"),
                ("SOFA-001", "Sofa", "2.00", "0.90", "0.85", "#64748b"),
            ],
        ),
        (
            "Tables",
            2,
            [
                ("TABLE-001", "Dining table", "1.60", "0.90", "0.75", "#78716c"),
                ("DESK-001", "Desk", "1.40", "0.70", "0.75", "#92400e"),
            ],
        ),
        (
            "Bedroom",
            3,
            [("BED-001", "Bed", "2.00", "1.60", "0.50", "#6366f1")],
        ),
        (
            "Storage",
            4,
            [("SHELF-001", "Bookshelf", "1.00", "0.35", "1.80", "#a16207")],
        ),
        (
            "Decor",
            5,
            [("PLANT-001", "Plant", "0.40", "0.40", "1.20", "#16a34a")],
        ),
    ]

    for name, sort_order, items in seeds:
        category, _ = FurnitureCategory.objects.get_or_create(
            name=name,
            defaults={"sort_order": sort_order},
        )
        if category.sort_order != sort_order:
            category.sort_order = sort_order
            category.save(update_fields=["sort_order"])

        for identifier, item_name, width, depth, height, color in items:
            FurnitureCatalogItem.objects.get_or_create(
                category=category,
                identifier=identifier,
                defaults={
                    "name": item_name,
                    "width": Decimal(width),
                    "depth": Decimal(depth),
                    "height": Decimal(height),
                    "color": color,
                    "is_active": True,
                },
            )


def unseed_furniture_catalog(apps, schema_editor):
    FurnitureCategory = apps.get_model("interior_design", "FurnitureCategory")
    FurnitureCatalogItem = apps.get_model("interior_design", "FurnitureCatalogItem")
    FurnitureCatalogItem.objects.all().delete()
    FurnitureCategory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("interior_design", "0002_project_layout_cad"),
    ]

    operations = [
        migrations.CreateModel(
            name="FurnitureCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={
                "verbose_name_plural": "furniture categories",
                "ordering": ["sort_order", "name"],
            },
        ),
        migrations.CreateModel(
            name="FurnitureCatalogItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("identifier", models.CharField(help_text="Unique product code, e.g. TBL-001", max_length=64)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("width", models.DecimalField(decimal_places=2, help_text="Width in meters", max_digits=6)),
                ("depth", models.DecimalField(decimal_places=2, help_text="Depth in meters", max_digits=6)),
                ("height", models.DecimalField(decimal_places=2, help_text="Height in meters", max_digits=6)),
                ("color", models.CharField(default="#64748b", max_length=7)),
                (
                    "image",
                    models.FileField(
                        blank=True,
                        help_text="Product photo (PNG, JPG, WebP, SVG).",
                        null=True,
                        upload_to="furniture/images/",
                    ),
                ),
                (
                    "cad_file",
                    models.FileField(
                        blank=True,
                        help_text="Optional CAD model or drawing.",
                        null=True,
                        upload_to="furniture/cad/",
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
                        to="interior_design.furniturecategory",
                    ),
                ),
            ],
            options={
                "ordering": ["category__sort_order", "category__name", "identifier"],
                "unique_together": {("category", "identifier")},
            },
        ),
        migrations.RunPython(seed_furniture_catalog, unseed_furniture_catalog),
    ]
