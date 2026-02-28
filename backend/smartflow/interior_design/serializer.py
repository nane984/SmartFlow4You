from rest_framework import serializers
from .models import InteriorProject

class InteriorProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteriorProject
        fields = '__all__'