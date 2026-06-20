# Supplier offer document upload + submitter tracking

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tenders", "0010_alter_tender_tender_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="supplieroffer",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="supplier_offers_submitted",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="supplieroffer",
            name="document",
            field=models.FileField(
                blank=True,
                help_text="Uploaded offer document (PDF, Excel, etc.).",
                null=True,
                upload_to="offers/documents/%Y/%m/",
            ),
        ),
    ]
