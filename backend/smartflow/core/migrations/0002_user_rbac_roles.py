# Extend User.role for RBAC + migrate legacy hr → hr_admin

from django.db import migrations, models


def migrate_hr_to_hr_admin(apps, schema_editor):
    User = apps.get_model("core", "User")
    User.objects.filter(role="hr").update(role="hr_admin")


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
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
                    ("hr", "HR (legacy)"),
                    ("interviewer", "Interviewer (legacy)"),
                ],
                db_index=True,
                default="candidate",
                help_text="Application role for module access (RBAC).",
                max_length=32,
            ),
        ),
        migrations.RunPython(migrate_hr_to_hr_admin, noop_reverse),
    ]
