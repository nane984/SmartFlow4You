import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hr", "0003_cv_submitted_by"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="interview_session",
            field=models.ForeignKey(
                blank=True,
                help_text="When set, this question is part of that interview room (not shown globally).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="session_questions",
                to="hr.interviewsession",
            ),
        ),
    ]
