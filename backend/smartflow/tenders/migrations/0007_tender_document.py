# Generated manually for Tender.document FileField

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0006_alter_tender_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="tender",
            name="document",
            field=models.FileField(
                blank=True,
                help_text="Primary tender document (PDF, Excel, Word, etc.).",
                null=True,
                upload_to="tender_uploads/%Y/%m/",
            ),
        ),
    ]
