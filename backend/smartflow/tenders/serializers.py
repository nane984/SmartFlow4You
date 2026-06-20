# pyright: reportIncompatibleVariableOverride=false
from typing import Any

from django.db.models.fields.files import FieldFile
from rest_framework import serializers
from rest_framework.request import Request

from .models import (
    Company,
    FinalOffer,
    OfferItem,
    RFQ,
    SupplierOffer,
    Tender,
    TenderDocument,
    TenderItem,
    WorkPackage,
    WorkPackageSubmission,
)


def _absolute_media_url(request: Request | None, file_field: FieldFile | None) -> str | None:
    """Return an absolute URL for a FileField (list + detail responses)."""
    if not file_field:
        return None
    try:
        url = file_field.url
    except (ValueError, AttributeError):
        return None
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = "__all__"
        extra_kwargs = {"company_type": {"required": False}}

    def create(self, validated_data):
        validated_data.setdefault("company_type", Company.CompanyType.CONTRACTOR)
        return super().create(validated_data)


class WorkPackageSubmissionSerializer(serializers.ModelSerializer):
    subcontractor_name = serializers.CharField(source="subcontractor.name", read_only=True)
    work_package_name = serializers.CharField(source="work_package.name", read_only=True)
    tender = serializers.IntegerField(source="work_package.tender_id", read_only=True)

    class Meta:
        model = WorkPackageSubmission
        fields = (
            "id",
            "subcontractor",
            "subcontractor_name",
            "work_package",
            "work_package_name",
            "tender",
            "uploaded_file",
            "status",
            "price",
            "submitted_at",
        )
        read_only_fields = ("submitted_at",)
        extra_kwargs = {
            "work_package": {"required": True},
            "subcontractor": {"required": True},
            "uploaded_file": {"required": True},
            "status": {"required": False},
            "price": {"required": False, "allow_null": True},
        }

    def to_representation(self, instance: WorkPackageSubmission) -> dict[str, Any]:
        data = super().to_representation(instance)
        absolute = _absolute_media_url(self.context.get("request"), instance.uploaded_file)
        if absolute:
            data["uploaded_file"] = absolute
        return data

    def validate_subcontractor(self, company: Company) -> Company:
        allowed = {
            str(Company.CompanyType.CONTRACTOR),
            str(Company.CompanyType.SUPPLIER),
        }
        if str(company.company_type) not in allowed:
            raise serializers.ValidationError(
                "Subcontractor must be a company with type contractor or supplier."
            )
        return company

    def validate_price(self, value):
        if value in (None, ""):
            return None
        return value


class WorkPackageSerializer(serializers.ModelSerializer):
    submissions = WorkPackageSubmissionSerializer(many=True, read_only=True)
    submission_count = serializers.SerializerMethodField()
    tender_title = serializers.CharField(source="tender.title", read_only=True)
    contractor_ids = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.filter(company_type=Company.CompanyType.CONTRACTOR),
        many=True,
        write_only=True,
        required=False,
        source="contractors",
    )
    contractor_names = serializers.SerializerMethodField()

    class Meta:
        model = WorkPackage
        fields = (
            "id",
            "tender",
            "tender_title",
            "name",
            "description",
            "work_category",
            "object_type",
            "template_file",
            "created_at",
            "submissions",
            "submission_count",
            "contractor_ids",
            "contractor_names",
        )
        read_only_fields = ("created_at",)
        extra_kwargs = {
            "tender": {"required": True},
            "template_file": {"required": False, "allow_null": True},
        }

    def get_submission_count(self, obj: WorkPackage) -> int:
        return obj.submissions.count()

    def get_contractor_names(self, obj: WorkPackage) -> list[str]:
        return list(obj.contractors.values_list("name", flat=True))

    def to_representation(self, instance: WorkPackage) -> dict[str, Any]:
        data = super().to_representation(instance)
        request = self.context.get("request")
        absolute_template = _absolute_media_url(request, instance.template_file)
        if absolute_template:
            data["template_file"] = absolute_template
        submissions_payload = data.get("submissions")
        if isinstance(submissions_payload, list):
            attached_subs = list(instance.submissions.all())
            for i, sub in enumerate(attached_subs):
                if i < len(submissions_payload) and sub.uploaded_file:
                    absolute_file = _absolute_media_url(request, sub.uploaded_file)
                    if absolute_file:
                        submissions_payload[i]["uploaded_file"] = absolute_file
        return data


class TenderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderItem
        fields = "__all__"
        extra_kwargs = {
            "tender": {"required": True},
        }


class TenderDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderDocument
        fields = "__all__"

    def to_representation(self, instance: TenderDocument) -> dict[str, Any]:
        data = super().to_representation(instance)
        absolute = _absolute_media_url(self.context.get("request"), instance.file)
        if absolute:
            data["file"] = absolute
        return data


class TenderSerializer(serializers.ModelSerializer):
    items = TenderItemSerializer(many=True, read_only=True)
    documents = TenderDocumentSerializer(many=True, read_only=True)
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        write_only=True,
        required=False,
        help_text="Alias for investor (multipart FormData); same as investor FK.",
    )
    supplier_ids = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.filter(company_type=Company.CompanyType.SUPPLIER),
        many=True,
        write_only=True,
        required=False,
        source="suppliers",
    )
    supplier_names = serializers.SerializerMethodField()
    analysis_summary = serializers.SerializerMethodField()

    class Meta:
        model = Tender
        fields = (
            "id",
            "title",
            "description",
            "investor",
            "company",
            "deadline",
            "status",
            "source",
            "external_id",
            "source_url",
            "tender_type",
            "visibility",
            "analysis_notes",
            "analysis_summary",
            "document",
            "created_at",
            "updated_at",
            "items",
            "documents",
            "supplier_ids",
            "supplier_names",
        )
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {
            "investor": {"required": False},
            "document": {"required": False, "allow_null": True},
        }

    def get_supplier_names(self, obj: Tender) -> list[str]:
        return list(obj.suppliers.values_list("name", flat=True))

    def get_analysis_summary(self, obj: Tender) -> dict:
        """Logical analysis layer payload for UI / future AI services."""
        categories = list(
            obj.work_packages.exclude(work_category="").values_list("work_category", flat=True).distinct()
        )
        return {
            "visibility": obj.visibility or "",
            "work_categories": categories,
            "work_package_count": obj.work_packages.count(),
            "submission_count": WorkPackageSubmission.objects.filter(
                work_package__tender_id=obj.pk
            ).count(),
            "notes": obj.analysis_notes or "",
        }

    def to_representation(self, instance: Tender) -> dict[str, Any]:
        data = super().to_representation(instance)
        request = self.context.get("request")
        absolute_doc = _absolute_media_url(request, instance.document)
        if absolute_doc:
            data["document"] = absolute_doc
        docs_payload = data.get("documents")
        if isinstance(docs_payload, list):
            attached = list(instance.documents.all())
            for i, attached_doc in enumerate(attached):
                if i < len(docs_payload):
                    absolute_file = _absolute_media_url(request, attached_doc.file)
                    if absolute_file:
                        docs_payload[i]["file"] = absolute_file
        return data

    def validate(self, attrs: dict) -> dict:
        company = attrs.pop("company", None)
        if company is not None:
            attrs["investor"] = company
        if self.instance is None and attrs.get("investor") is None:
            raise serializers.ValidationError(
                {"investor": "Provide investor or company (investor company id)."}
            )
        return attrs


class RFQSerializer(serializers.ModelSerializer):
    tender_title = serializers.CharField(source="tender.title", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = RFQ
        fields = "__all__"


class SupplierOfferSerializer(serializers.ModelSerializer):
    tender = serializers.IntegerField(source="rfq.tender_id", read_only=True)
    tender_title = serializers.CharField(source="rfq.tender.title", read_only=True)
    supplier = serializers.IntegerField(source="rfq.supplier_id", read_only=True)
    supplier_name = serializers.CharField(source="rfq.supplier.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    tender_id = serializers.PrimaryKeyRelatedField(
        queryset=Tender.objects.all(),
        write_only=True,
        required=False,
    )
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.filter(company_type=Company.CompanyType.SUPPLIER),
        write_only=True,
        required=False,
    )

    class Meta:
        model = SupplierOffer
        fields = (
            "id",
            "rfq",
            "tender",
            "tender_title",
            "supplier",
            "supplier_name",
            "tender_id",
            "supplier_id",
            "created_by",
            "created_by_name",
            "document",
            "submitted_at",
            "valid_until",
            "currency",
            "notes",
            "total_amount",
        )
        read_only_fields = ("submitted_at", "created_by")
        extra_kwargs = {
            "rfq": {"required": False},
            "total_amount": {"required": False, "allow_null": True},
            "document": {"required": False, "allow_null": True},
            "notes": {"required": False, "allow_blank": True},
            "currency": {"required": False},
            "valid_until": {"required": False, "allow_null": True},
        }

    def validate(self, attrs: dict) -> dict:
        tender = attrs.pop("tender_id", None)
        supplier = attrs.pop("supplier_id", None)
        rfq = attrs.get("rfq")
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None

        if rfq is None:
            if tender is None or supplier is None:
                raise serializers.ValidationError(
                    "Provide rfq or both tender_id and supplier_id."
                )
            rfq, _ = RFQ.objects.get_or_create(
                tender=tender,
                supplier=supplier,
                defaults={"status": RFQ.Status.SENT},
            )
            attrs["rfq"] = rfq
        else:
            tender = tender or rfq.tender
            supplier = supplier or rfq.supplier

        if user and getattr(user, "is_authenticated", False):
            from core.roles import is_procurement_staff, is_supplier_user
            from .access import (
                get_user_company_id,
                supplier_may_access_tender,
                supplier_may_use_company,
            )

            resolved_tender_id = getattr(tender, "pk", None) or getattr(
                attrs["rfq"].tender, "pk", None
            )
            resolved_supplier_id = getattr(supplier, "pk", None) or getattr(
                attrs["rfq"].supplier, "pk", None
            )

            if is_supplier_user(user) and not is_procurement_staff(user):
                own_company_id = get_user_company_id(user)
                if not own_company_id:
                    raise serializers.ValidationError(
                        "Supplier account has no linked company."
                    )
                if resolved_supplier_id != own_company_id:
                    raise serializers.ValidationError(
                        "You can only submit offers for your own company."
                    )
                if not supplier_may_access_tender(user, resolved_tender_id):
                    raise serializers.ValidationError(
                        "You are not assigned to this tender."
                    )
            elif not is_procurement_staff(user):
                raise serializers.ValidationError(
                    "You do not have permission to submit offers."
                )
            elif resolved_supplier_id and not supplier_may_use_company(
                user, resolved_supplier_id
            ):
                raise serializers.ValidationError(
                    {"supplier_id": "Invalid supplier for this account."}
                )

        return attrs

    def validate_total_amount(self, value):
        if value in (None, ""):
            return None
        return value

    def to_representation(self, instance: SupplierOffer) -> dict[str, Any]:
        data = super().to_representation(instance)
        absolute = _absolute_media_url(self.context.get("request"), instance.document)
        if absolute:
            data["document"] = absolute
        return data


class OfferItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferItem
        fields = "__all__"


class FinalOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalOffer
        fields = "__all__"
