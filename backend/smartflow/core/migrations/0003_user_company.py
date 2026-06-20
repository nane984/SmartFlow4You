# Link User to Company for supplier / tender_user scoping

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_user_rbac_roles"),
        ("tenders", "0011_supplieroffer_document_created_by"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="company",
            field=models.ForeignKey(
                blank=True,
                help_text="Linked organization (required for supplier/tender_user scoping when set).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="users",
                to="tenders.company",
            ),
        ),
    ]
