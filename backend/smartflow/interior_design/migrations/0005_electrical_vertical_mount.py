from decimal import Decimal

from django.db import migrations, models


def set_default_vertical_mounts(apps, schema_editor):
    ElectricalCatalogItem = apps.get_model("interior_design", "ElectricalCatalogItem")
    updates = {
        "light": ("ceiling", None),
        "switch": ("custom", Decimal("1.10")),
        "outlet": ("custom", Decimal("0.30")),
        "junction": ("custom", Decimal("2.40")),
    }
    for part_type, (mount, elevation) in updates.items():
        ElectricalCatalogItem.objects.filter(part_type=part_type).update(
            vertical_mount=mount,
            mount_elevation=elevation,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("interior_design", "0004_electrical_catalog"),
    ]

    operations = [
        migrations.AddField(
            model_name="electricalcatalogitem",
            name="mount_elevation",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Bottom edge height from floor (m) when vertical_mount is custom.",
                max_digits=6,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="electricalcatalogitem",
            name="vertical_mount",
            field=models.CharField(
                choices=[
                    ("floor", "On floor"),
                    ("ceiling", "On ceiling"),
                    ("custom", "Custom height"),
                ],
                default="floor",
                help_text="Default vertical placement in 3D (floor, ceiling, or custom height).",
                max_length=10,
            ),
        ),
        migrations.RunPython(set_default_vertical_mounts, migrations.RunPython.noop),
    ]
