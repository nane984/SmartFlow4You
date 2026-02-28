from rest_framework import serializers
from .models import JobPost, CV

class JobPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = '__all__'


class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model = CV
        fields = '__all__'