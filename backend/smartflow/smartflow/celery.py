import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smartflow.settings")

app = Celery("smartflow")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Beat schedule: check every 15 minutes which definitions are due
app.conf.beat_schedule = {
    "run-due-tender-definitions": {
        "task": "tenders.run_due_tender_definitions",
        "schedule": crontab(minute="*/15"),
    },
}
