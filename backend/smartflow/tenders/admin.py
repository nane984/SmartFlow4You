from django.contrib import admin

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


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "company_type", "city", "email", "created_at")
    list_filter = ("company_type",)
    search_fields = ("name", "email", "city")


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "investor",
        "source",
        "external_id",
        "deadline",
        "status",
        "created_at",
    )
    list_filter = ("status", "source")
    search_fields = ("title", "description", "external_id")
    raw_id_fields = ("investor",)


@admin.register(TenderDocument)
class TenderDocumentAdmin(admin.ModelAdmin):
    list_display = ("tender", "label", "uploaded_at")
    list_filter = ("uploaded_at",)
    raw_id_fields = ("tender",)


@admin.register(WorkPackage)
class WorkPackageAdmin(admin.ModelAdmin):
    list_display = ("name", "tender", "created_at")
    list_filter = ("tender",)
    search_fields = ("name", "description")
    raw_id_fields = ("tender",)


@admin.register(WorkPackageSubmission)
class WorkPackageSubmissionAdmin(admin.ModelAdmin):
    list_display = ("work_package", "subcontractor", "status", "price", "submitted_at")
    list_filter = ("status",)
    raw_id_fields = ("work_package", "subcontractor")


@admin.register(TenderItem)
class TenderItemAdmin(admin.ModelAdmin):
    list_display = ("name", "tender", "quantity", "unit")
    search_fields = ("name",)
    raw_id_fields = ("tender",)


@admin.register(RFQ)
class RFQAdmin(admin.ModelAdmin):
    list_display = ("reference_code", "tender", "supplier", "status", "issued_at")
    list_filter = ("status",)
    raw_id_fields = ("tender", "supplier")


@admin.register(SupplierOffer)
class SupplierOfferAdmin(admin.ModelAdmin):
    list_display = ("rfq", "currency", "total_amount", "created_by", "submitted_at")
    raw_id_fields = ("rfq", "created_by")


@admin.register(OfferItem)
class OfferItemAdmin(admin.ModelAdmin):
    list_display = ("supplier_offer", "tender_item", "quantity", "unit_price", "line_total")
    raw_id_fields = ("supplier_offer", "tender_item")


@admin.register(FinalOffer)
class FinalOfferAdmin(admin.ModelAdmin):
    list_display = ("tender", "supplier_offer", "decided_at")
    raw_id_fields = ("tender", "supplier_offer")
