from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_candidateregistrationpending"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Administrator"),
                    ("hr_admin", "HR Admin"),
                    ("tender_user", "Tender user"),
                    ("supplier", "Supplier"),
                    ("candidate", "Candidate"),
                    ("designer", "Designer"),
                    ("hr", "HR (legacy)"),
                    ("interviewer", "Interviewer (legacy)"),
                ],
                db_index=True,
                default="candidate",
                help_text="Application role for module access (RBAC).",
                max_length=32,
            ),
        ),
    ]
