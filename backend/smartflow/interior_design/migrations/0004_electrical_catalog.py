from decimal import Decimal

from django.db import migrations, models


def seed_electrical_catalog(apps, schema_editor):
    ElectricalCategory = apps.get_model("interior_design", "ElectricalCategory")
    ElectricalCatalogItem = apps.get_model("interior_design", "ElectricalCatalogItem")

    seeds = [
        (
            "Outlets & switches",
            1,
            [
                ("OUT-001", "Single outlet", "outlet", "0.08", "0.08", "0", "#eab308", "230", "16", None, "C1", 1),
                ("OUT-002", "Double outlet", "outlet", "0.12", "0.08", "0", "#eab308", "230", "16", None, "C1", 1),
                ("SW-001", "Light switch", "switch", "0.08", "0.08", "0", "#f59e0b", "230", "10", None, "C2", 1),
            ],
        ),
        (
            "Distribution",
            2,
            [
                ("PNL-001", "Main panel", "panel", "0.60", "0.25", "1.80", "#ca8a04", "400", "63", None, "MAIN", 3),
                ("BRK-001", "16A breaker", "breaker", "0.10", "0.08", "0", "#a16207", "230", "16", None, "C1", 1),
            ],
        ),
        (
            "Wiring",
            3,
            [
                ("WIR-001", "Cable run 2.5mm²", "wire", "0.06", "1.00", "0", "#854d0e", "230", "16", "2.5", "C1", 1),
                ("JCT-001", "Junction box", "junction", "0.12", "0.12", "0", "#78716c", "230", "16", "2.5", "C1", 1),
            ],
        ),
        (
            "Lighting",
            4,
            [
                ("LGT-001", "Ceiling light", "light", "0.20", "0.20", "0", "#fde047", "230", "6", "1.5", "C2", 1),
            ],
        ),
    ]

    for name, sort_order, items in seeds:
        category, _ = ElectricalCategory.objects.get_or_create(
            name=name,
            defaults={"sort_order": sort_order},
        )
        if category.sort_order != sort_order:
            category.sort_order = sort_order
            category.save(update_fields=["sort_order"])

        for row in items:
            ident, item_name, part_type, w, d, h, color, volt, amp, gauge, circuit, phases = row
            gauge_val = Decimal(gauge) if gauge else None
            ElectricalCatalogItem.objects.get_or_create(
                category=category,
                identifier=ident,
                defaults={
                    "name": item_name,
                    "part_type": part_type,
                    "width": Decimal(w),
                    "depth": Decimal(d),
                    "height": Decimal(h),
                    "color": color,
                    "voltage_v": Decimal(volt),
                    "amperage_a": Decimal(amp),
                    "wire_gauge_mm2": gauge_val,
                    "circuit_id": circuit,
                    "phases": phases,
                    "is_active": True,
                },
            )


def unseed_electrical_catalog(apps, schema_editor):
    ElectricalCategory = apps.get_model("interior_design", "ElectricalCategory")
    ElectricalCatalogItem = apps.get_model("interior_design", "ElectricalCatalogItem")
    ElectricalCatalogItem.objects.all().delete()
    ElectricalCategory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("interior_design", "0003_furniture_catalog"),
    ]

    operations = [
        migrations.CreateModel(
            name="ElectricalCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={
                "verbose_name_plural": "electrical categories",
                "ordering": ["sort_order", "name"],
            },
        ),
        migrations.CreateModel(
            name="ElectricalCatalogItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("identifier", models.CharField(help_text="Unique part code, e.g. OUT-001", max_length=64)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "part_type",
                    models.CharField(
                        choices=[
                            ("outlet", "Outlet / socket"),
                            ("switch", "Switch"),
                            ("panel", "Distribution panel"),
                            ("junction", "Junction box"),
                            ("wire", "Wire / cable run"),
                            ("light", "Light fixture"),
                            ("breaker", "Circuit breaker"),
                            ("other", "Other"),
                        ],
                        default="outlet",
                        max_length=20,
                    ),
                ),
                ("width", models.DecimalField(decimal_places=2, help_text="Plan width in meters", max_digits=6)),
                ("depth", models.DecimalField(decimal_places=2, help_text="Plan depth in meters", max_digits=6)),
                (
                    "height",
                    models.DecimalField(
                        decimal_places=2,
                        default=0,
                        help_text="Height / mounting height in meters (0 if N/A)",
                        max_digits=6,
                    ),
                ),
                ("color", models.CharField(default="#eab308", max_length=7)),
                (
                    "voltage_v",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Nominal voltage (V)",
                        max_digits=8,
                        null=True,
                    ),
                ),
                (
                    "amperage_a",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Current rating (A)",
                        max_digits=8,
                        null=True,
                    ),
                ),
                (
                    "wire_gauge_mm2",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Wire cross-section (mm²)",
                        max_digits=6,
                        null=True,
                    ),
                ),
                (
                    "circuit_id",
                    models.CharField(blank=True, help_text="Circuit label, e.g. C1", max_length=32),
                ),
                (
                    "phases",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        help_text="Number of phases (1 or 3)",
                        null=True,
                    ),
                ),
                (
                    "image",
                    models.FileField(
                        blank=True,
                        help_text="Symbol photo or diagram (PNG, JPG, SVG).",
                        null=True,
                        upload_to="electrical/images/",
                    ),
                ),
                (
                    "cad_file",
                    models.FileField(
                        blank=True,
                        help_text="Optional CAD symbol or drawing.",
                        null=True,
                        upload_to="electrical/cad/",
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
                        to="interior_design.electricalcategory",
                    ),
                ),
            ],
            options={
                "ordering": ["category__sort_order", "category__name", "identifier"],
                "unique_together": {("category", "identifier")},
            },
        ),
        migrations.RunPython(seed_electrical_catalog, unseed_electrical_catalog),
    ]
