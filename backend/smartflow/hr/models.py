from django.db import models
from core.models import User


class JobPost(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)


class CV(models.Model):
    file = models.FileField(upload_to='cvs/')                       # u folder cvs uploaduje cv
    aplicant_name = models.CharField(max_length=255)
    job_post = models.ForeignKey(JobPost, on_delete=models.CASCADE)
    score = models.FloatField(null=True)
    processed = models.BooleanField(default=False)