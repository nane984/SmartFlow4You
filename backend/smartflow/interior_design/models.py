from django.db import models

class InteriorProject(models.Model):
    client_name = models.CharField(max_length=255)
    description = models.TextField()
    floorplan_file = models.FileField(upload_to='floorplans/')
    style_preference = models.JSONField(default=dict)
    ai_generated_images = models.JSONField(default=list)            # urls of generated images