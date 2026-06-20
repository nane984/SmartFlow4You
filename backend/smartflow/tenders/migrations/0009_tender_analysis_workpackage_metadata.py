# Enterprise metadata: tender analysis layer, work package categories, company relations

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0008_workpackage_workpackagesubmission"),
    ]

    operations = [
        migrations.AddField(
            model_name="tender",
            name="visibility",
            field=models.CharField(
                blank=True,
                choices=[("public", "Public"), ("private", "Private")],
                db_index=True,
                default="public",
                help_text="Tender classification for analysis layer (public vs private procurement).",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="tender",
            name="analysis_notes",
            field=models.TextField(
                blank=True,
                help_text="Tender analysis layer — AI summaries, categorization notes (future automation).",
            ),
        ),
        migrations.AddField(
            model_name="workpackage",
            name="work_category",
            field=models.CharField(
                blank=True,
                choices=[
                    ("electrical", "Electrical works"),
                    ("hvac", "HVAC"),
                    ("civil", "Civil works"),
                    ("finishing", "Finishing works"),
                ],
                db_index=True,
                help_text="Trade / work type for analysis and reporting.",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="workpackage",
            name="object_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("residential", "Residential"),
                    ("commercial", "Commercial"),
                    ("industrial", "Industrial"),
                    ("infrastructure", "Infrastructure"),
                ],
                db_index=True,
                help_text="Building or project object classification.",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="tender",
            name="suppliers",
            field=models.ManyToManyField(
                blank=True,
                help_text="Supplier companies engaged in this tender context.",
                related_name="supplier_tenders",
                to="tenders.company",
            ),
        ),
        migrations.AddField(
            model_name="workpackage",
            name="contractors",
            field=models.ManyToManyField(
                blank=True,
                help_text="Contractor companies eligible for this work package.",
                related_name="assigned_work_packages",
                to="tenders.company",
            ),
        ),
    ]
