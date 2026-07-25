# Tender Definition demo workflow — execution log stats + notification tender FK

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0014_tender_definition_management"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenderdefinitionexecutionlog",
            name="received_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="tenderdefinitionexecutionlog",
            name="matched_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="tenderdefinitionexecutionlog",
            name="duplicate_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="tendernotification",
            name="tender",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notifications",
                to="tenders.tender",
            ),
        ),
    ]
