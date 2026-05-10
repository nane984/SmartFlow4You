# pyright: reportIncompatibleVariableOverride=false
from rest_framework import serializers

from .models import (
    Company,
    FinalOffer,
    OfferItem,
    RFQ,
    SupplierOffer,
    Tender,
    TenderDocument,
    TenderItem,
)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = "__all__"
        extra_kwargs = {"company_type": {"required": False}}

    def create(self, validated_data):
        validated_data.setdefault("company_type", Company.CompanyType.CONTRACTOR)
        return super().create(validated_data)


class TenderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderItem
        fields = "__all__"


class TenderDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderDocument
        fields = "__all__"


class TenderSerializer(serializers.ModelSerializer):
    items = TenderItemSerializer(many=True, read_only=True)
    documents = TenderDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Tender
        fields = (
            "id",
            "title",
            "description",
            "investor",
            "deadline",
            "status",
            "source",
            "external_id",
            "source_url",
            "tender_type",
            "created_at",
            "updated_at",
            "items",
            "documents",
        )
        read_only_fields = ("created_at", "updated_at")


class RFQSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQ
        fields = "__all__"


class SupplierOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierOffer
        fields = "__all__"


class OfferItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferItem
        fields = "__all__"


class FinalOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalOffer
        fields = "__all__"
