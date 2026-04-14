from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("hr", "0002_interviewsession_question_videosubmission_answer"),
    ]

    operations = [
        migrations.AddField(
            model_name="cv",
            name="submitted_by",
            field=models.ForeignKey(
                blank=True,
                help_text="Authenticated user who submitted this CV (for candidate-scoped APIs).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="submitted_cvs",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
