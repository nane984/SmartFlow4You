from django.db import models
from core.models import User

class WorkLog(models.Model):
    empoloyee = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    hours_worked = models.FloatField()
    tasks_done = models.TextField()