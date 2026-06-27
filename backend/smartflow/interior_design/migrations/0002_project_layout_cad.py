import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("interior_design", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="interiorproject",
            name="ai_suggestions",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="interiorproject",
            name="cad_file",
            field=models.FileField(
                blank=True,
                help_text="Optional CAD source file (DWG/DXF/PDF floor plan).",
                null=True,
                upload_to="cad_models/",
            ),
        ),
        migrations.AddField(
            model_name="interiorproject",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name="interiorproject",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="interior_projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="interiorproject",
            name="layout_data",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Room dimensions and placed furniture items.",
            ),
        ),
        migrations.AddField(
            model_name="interiorproject",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="interiorproject",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="interiorproject",
            name="floorplan_file",
            field=models.FileField(blank=True, null=True, upload_to="floorplans/"),
        ),
        migrations.AlterField(
            model_name="interiorproject",
            name="style_preference",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="interiorproject",
            name="ai_generated_images",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterModelOptions(
            name="interiorproject",
            options={"ordering": ["-updated_at", "-id"]},
        ),
    ]
