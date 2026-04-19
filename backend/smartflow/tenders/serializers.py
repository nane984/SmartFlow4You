from rest_framework import serializers
from .models import Company, Tender, Offer

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'


class TenderSerializer(serializers.ModelSerializer):
    companies = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Company.objects.all()
    )
    class Meta:
        model = Tender
        fields = '__all__'


class OfferSerializer(serializers.ModelSerializer):
    """Exposes all offer fields, including `file` uploads (multipart)."""

    class Meta:
        model = Offer
        fields = '__all__'