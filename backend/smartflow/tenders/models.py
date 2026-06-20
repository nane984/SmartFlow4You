# pyright: reportIncompatibleVariableOverride=false
# pyright: reportCallIssue=false
from decimal import Decimal
from typing import cast

from django.core.exceptions import ValidationError
from django.db import models
from core.models import User


class Company(models.Model):
    """Organization participating in tenders as investor, contractor, or supplier."""

    class CompanyType(models.TextChoices):
        INVESTOR = "investor", "Investor"
        CONTRACTOR = "contractor", "Contractor"
        SUPPLIER = "supplier", "Supplier"

    company_type = models.CharField(
        max_length=20,
        choices=CompanyType.choices,
        db_index=True,
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["company_type", "name"]),
        ]

    def __str__(self) -> str:
        code = str(self.company_type)
        for value, label in self.CompanyType.choices:
            if str(value) == code:
                return f"{self.name} ({label})"
        return f"{self.name} ({code})"


class Tender(models.Model):
    """Procurement / tender issued by an investor organization."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        EVALUATION = "evaluation", "Evaluation"
        CLOSED = "closed", "Closed"
        AWARDED = "awarded", "Awarded"
        CANCELLED = "cancelled", "Cancelled"

    class InputSource(models.TextChoices):
        MANUAL = "manual", "Manual"
        EMAIL = "email", "Email"
        API = "api", "API"

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    investor = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="invested_tenders",
        help_text="Investor organization issuing this tender.",
    )
    deadline = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    source = models.CharField(
        max_length=20,
        choices=InputSource.choices,
        default=InputSource.MANUAL,
        blank=True,
        db_index=True,
        help_text="How this tender was captured (manual entry, email ingest, or API).",
    )
    external_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Identifier from an external system, if any.",
    )
    source_url = models.URLField(
        max_length=2048,
        blank=True,
        help_text="Link to the original tender listing or source record.",
    )
    tender_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Legacy/free-form type label; prefer visibility for public vs private.",
    )
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PUBLIC,
        blank=True,
        db_index=True,
        help_text="Tender classification for analysis layer (public vs private procurement).",
    )
    analysis_notes = models.TextField(
        blank=True,
        help_text="Tender analysis layer — AI summaries, categorization notes (future automation).",
    )
    suppliers = models.ManyToManyField(
        Company,
        related_name="supplier_tenders",
        blank=True,
        help_text="Supplier companies engaged in this tender context.",
    )
    document = models.FileField(
        upload_to="tender_uploads/%Y/%m/",
        blank=True,
        null=True,
        help_text="Primary tender document (PDF, Excel, Word, etc.).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        code = str(self.status)
        for value, label in self.Status.choices:
            if str(value) == code:
                return f"{self.title} ({label})"
        return f"{self.title} ({code})"


class TenderDocument(models.Model):
    """File attachment belonging to a tender."""

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    label = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to="tender_documents/%Y/%m/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        label = str(self.label).strip()
        if label:
            return label
        f = getattr(self, "file", None)
        fname = getattr(f, "name", "") if f else ""
        return str(fname) if fname else "Document"


class WorkPackage(models.Model):
    """Scoped package of work within a tender (admin-defined, own Excel template)."""

    class WorkCategory(models.TextChoices):
        ELECTRICAL = "electrical", "Electrical works"
        HVAC = "hvac", "HVAC"
        CIVIL = "civil", "Civil works"
        FINISHING = "finishing", "Finishing works"

    class ObjectType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        INDUSTRIAL = "industrial", "Industrial"
        INFRASTRUCTURE = "infrastructure", "Infrastructure"

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="work_packages",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    work_category = models.CharField(
        max_length=30,
        choices=WorkCategory.choices,
        blank=True,
        db_index=True,
        help_text="Trade / work type for analysis and reporting.",
    )
    object_type = models.CharField(
        max_length=30,
        choices=ObjectType.choices,
        blank=True,
        db_index=True,
        help_text="Building or project object classification.",
    )
    contractors = models.ManyToManyField(
        Company,
        related_name="assigned_work_packages",
        blank=True,
        help_text="Contractor companies eligible for this work package.",
    )
    template_file = models.FileField(
        upload_to="work_packages/templates/%Y/%m/",
        blank=True,
        null=True,
        help_text="Excel template subcontractors fill in and return.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self) -> str:
        tender = cast(Tender, self.tender)
        return f"{self.name} — {tender.title}"


class WorkPackageSubmission(models.Model):
    """Subcontractor bid for a work package (completed Excel upload)."""

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        REVIEWED = "reviewed", "Reviewed"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    subcontractor = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="work_package_submissions",
    )
    work_package = models.ForeignKey(
        WorkPackage,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    uploaded_file = models.FileField(upload_to="work_packages/submissions/%Y/%m/")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
        db_index=True,
    )
    price = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        null=True,
        blank=True,
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at", "-id"]

    def clean(self):
        super().clean()
        if not getattr(self, "subcontractor_id", None):
            return
        sub = cast(Company, self.subcontractor)
        allowed = {
            str(Company.CompanyType.CONTRACTOR),
            str(Company.CompanyType.SUPPLIER),
        }
        if str(sub.company_type) not in allowed:
            raise ValidationError(
                {
                    "subcontractor": (
                        "Submissions must be from a contractor or supplier company."
                    )
                }
            )

    def __str__(self) -> str:
        sub = cast(Company, self.subcontractor)
        wp = cast(WorkPackage, self.work_package)
        return f"{sub.name} → {wp.name} ({self.status})"


class TenderItem(models.Model):
    """Line item (bill of quantities) for a tender."""

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="items",
    )
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50, help_text="Unit of measure, e.g. kg, m², hour.")
    quantity = models.DecimalField(max_digits=14, decimal_places=4)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.name} ({self.quantity} {self.unit})"


class RFQ(models.Model):
    """Request for quotation sent to a supplier for a specific tender."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        RESPONDED = "responded", "Responded"
        CLOSED = "closed", "Closed"

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="rfqs",
    )
    supplier = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="rfqs",
    )
    reference_code = models.CharField(max_length=100, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-issued_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["tender", "supplier"],
                name="unique_rfq_per_tender_supplier",
            ),
        ]

    def clean(self):
        super().clean()
        if not getattr(self, "supplier_id", None):
            return
        supplier = cast(Company, self.supplier)
        if str(supplier.company_type) != str(Company.CompanyType.SUPPLIER):
            raise ValidationError(
                {"supplier": "RFQ supplier must be a company with type Supplier."}
            )

    def __str__(self) -> str:
        tender = cast(Tender, self.tender)
        supplier = cast(Company, self.supplier)
        return f"RFQ {self.reference_code or self.pk} — {tender.title} → {supplier.name}"


class SupplierOffer(models.Model):
    """Supplier's priced response linked to an RFQ."""

    rfq = models.ForeignKey(
        RFQ,
        on_delete=models.CASCADE,
        related_name="supplier_offers",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplier_offers_submitted",
    )
    document = models.FileField(
        upload_to="offers/documents/%Y/%m/",
        blank=True,
        null=True,
        help_text="Uploaded offer document (PDF, Excel, etc.).",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=3, default="EUR")
    notes = models.TextField(blank=True)
    total_amount = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional total; can mirror sum of line items.",
    )

    class Meta:
        ordering = ["-submitted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["rfq"],
                name="unique_supplier_offer_per_rfq",
            ),
        ]

    def __str__(self) -> str:
        rid = getattr(self, "rfq_id", None)
        return f"Offer for RFQ {rid or '—'} ({self.currency} {self.total_amount or '—'})"


class OfferItem(models.Model):
    """Line-level pricing in a supplier offer, tied to a tender line item."""

    supplier_offer = models.ForeignKey(
        SupplierOffer,
        on_delete=models.CASCADE,
        related_name="items",
    )
    tender_item = models.ForeignKey(
        TenderItem,
        on_delete=models.CASCADE,
        related_name="offer_items",
    )
    unit_price = models.DecimalField(max_digits=16, decimal_places=4)
    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        help_text="Quoted quantity (may match or partially cover tender item quantity).",
    )
    line_total = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional line total; defaults to quantity × unit_price if omitted.",
    )

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["supplier_offer", "tender_item"],
                name="unique_offer_line_per_tender_item",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.line_total is None and self.quantity is not None and self.unit_price is not None:
            qty = cast(Decimal, self.quantity)
            unit = cast(Decimal, self.unit_price)
            self.line_total = (qty * unit).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        item_pk = getattr(self, "tender_item_id", None)
        offer_pk = getattr(self, "supplier_offer_id", None)
        if not item_pk or not offer_pk:
            return
        supplier_offer = cast(SupplierOffer, self.supplier_offer)
        rfq = cast(RFQ, supplier_offer.rfq)
        tender_item = cast(TenderItem, self.tender_item)
        rfq_tid = getattr(rfq, "tender_id", None)
        line_tid = getattr(tender_item, "tender_id", None)
        if rfq_tid is not None and line_tid is not None and line_tid != rfq_tid:
            raise ValidationError(
                {"tender_item": "Tender item must belong to the same tender as the RFQ."}
            )

    def __str__(self) -> str:
        return f"{self.tender_item.name}: {self.quantity} × {self.unit_price}"


class FinalOffer(models.Model):
    """Awarded outcome: selected supplier offer for a tender."""

    tender = models.OneToOneField(
        Tender,
        on_delete=models.CASCADE,
        related_name="final_offer",
    )
    supplier_offer = models.ForeignKey(
        SupplierOffer,
        on_delete=models.PROTECT,
        related_name="final_awards",
    )
    decided_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-decided_at"]

    def clean(self):
        super().clean()
        soid = getattr(self, "supplier_offer_id", None)
        tid = getattr(self, "tender_id", None)
        if not soid or not tid:
            return
        supplier_offer = cast(SupplierOffer, self.supplier_offer)
        rfq = cast(RFQ, supplier_offer.rfq)
        rfq_tid = getattr(rfq, "tender_id", None)
        if rfq_tid is not None and rfq_tid != tid:
            raise ValidationError(
                {"supplier_offer": "Supplier offer must belong to an RFQ for this tender."}
            )

    def __str__(self) -> str:
        tender = cast(Tender, self.tender)
        offer_pk = getattr(self, "supplier_offer_id", None) or "—"
        return f"Final: {tender.title} → Offer #{offer_pk}"
