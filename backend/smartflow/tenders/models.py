from django.db import models
from core.models import User

class Company(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    contact_person = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)


class Tender(models.Model):
    title = models.CharField(max_length=255)
    source = models.CharField(max_length=255)   #portal, mail, private
    description = models.TextField()
    deadline = models.DateTimeField()
    type = models.CharField(max_length=50)      #javni, privatni
    companies = models.ManyToManyField(Company, related_name="tenders")
    status = models.CharField(max_length=50, default="new")


class Offer(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to="offers/")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
