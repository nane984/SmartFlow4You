from django.db import migrations, models


def forwards_normalize_source(apps, schema_editor):
    Tender = apps.get_model("tenders", "Tender")
    allowed = {"manual", "email", "api"}
    for row in Tender.objects.all().iterator():
        raw = (getattr(row, "source", None) or "").strip().lower()
        if raw in allowed:
            new_val = raw
        elif "api" in raw:
            new_val = "api"
        elif "email" in raw or raw in ("mail", "e-mail", "e_mail"):
            new_val = "email"
        else:
            new_val = "manual"
        Tender.objects.filter(pk=row.pk).update(source=new_val)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0004_company_phone"),
    ]

    operations = [
        migrations.AddField(
            model_name="tender",
            name="external_id",
            field=models.CharField(
                blank=True,
                help_text="Identifier from an external system, if any.",
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name="tender",
            name="source_url",
            field=models.URLField(
                blank=True,
                help_text="Link to the original tender listing or source record.",
                max_length=2048,
            ),
        ),
        migrations.RunPython(forwards_normalize_source, noop_reverse),
        migrations.AlterField(
            model_name="tender",
            name="source",
            field=models.CharField(
                blank=True,
                choices=[
                    ("manual", "Manual"),
                    ("email", "Email"),
                    ("api", "API"),
                ],
                db_index=True,
                default="manual",
                help_text="How this tender was captured (manual entry, email ingest, or API).",
                max_length=20,
            ),
        ),
    ]
