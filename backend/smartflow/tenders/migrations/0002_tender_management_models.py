# Manual migration: tender management schema (Company type, Tender investor, related entities).

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


def forwards_fill_investor_from_m2m(apps, schema_editor):
    Tender = apps.get_model("tenders", "Tender")
    Company = apps.get_model("tenders", "Company")
    for tender in Tender.objects.all():
        first = tender.companies.first()
        if first:
            tender.investor_id = first.pk
        else:
            inv, _ = Company.objects.get_or_create(
                name="Legacy tender — assign investor",
                defaults={
                    "email": "legacy@example.com",
                    "city": "—",
                    "company_type": "investor",
                },
            )
            tender.investor_id = inv.pk
        tender.save(update_fields=["investor_id"])


def forwards_map_tender_status(apps, schema_editor):
    Tender = apps.get_model("tenders", "Tender")
    Tender.objects.filter(status="new").update(status="draft")


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(name="Offer"),
        migrations.AddField(
            model_name="company",
            name="company_type",
            field=models.CharField(
                choices=[
                    ("investor", "Investor"),
                    ("contractor", "Contractor"),
                    ("supplier", "Supplier"),
                ],
                db_index=True,
                default="contractor",
                max_length=20,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="company",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="tender",
            name="investor",
            field=models.ForeignKey(
                help_text="Investor organization issuing this tender.",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="invested_tenders",
                to="tenders.company",
            ),
        ),
        migrations.RunPython(forwards_fill_investor_from_m2m, noop_reverse),
        migrations.RemoveField(
            model_name="tender",
            name="companies",
        ),
        migrations.RenameField(
            model_name="tender",
            old_name="type",
            new_name="tender_type",
        ),
        migrations.AlterField(
            model_name="tender",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="tender",
            name="source",
            field=models.CharField(
                blank=True,
                help_text="Origin e.g. portal, email, private.",
                max_length=255,
            ),
        ),
        migrations.AlterField(
            model_name="tender",
            name="tender_type",
            field=models.CharField(
                blank=True,
                help_text="e.g. public, private.",
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="tender",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("evaluation", "Evaluation"),
                    ("closed", "Closed"),
                    ("awarded", "Awarded"),
                    ("cancelled", "Cancelled"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.RunPython(forwards_map_tender_status, noop_reverse),
        migrations.AddField(
            model_name="tender",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="tender",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="tender",
            name="investor",
            field=models.ForeignKey(
                help_text="Investor organization issuing this tender.",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="invested_tenders",
                to="tenders.company",
            ),
        ),
        migrations.CreateModel(
            name="TenderDocument",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("label", models.CharField(blank=True, max_length=255)),
                ("file", models.FileField(upload_to="tender_documents/%Y/%m/")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="documents",
                        to="tenders.tender",
                    ),
                ),
            ],
            options={
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="TenderItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "unit",
                    models.CharField(
                        help_text="Unit of measure, e.g. kg, m², hour.",
                        max_length=50,
                    ),
                ),
                ("quantity", models.DecimalField(decimal_places=4, max_digits=14)),
                (
                    "tender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="tenders.tender",
                    ),
                ),
            ],
            options={
                "ordering": ["id"],
            },
        ),
        migrations.CreateModel(
            name="RFQ",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("reference_code", models.CharField(blank=True, max_length=100)),
                ("issued_at", models.DateTimeField(auto_now_add=True)),
                ("due_date", models.DateTimeField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("sent", "Sent"),
                            ("responded", "Responded"),
                            ("closed", "Closed"),
                        ],
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("notes", models.TextField(blank=True)),
                (
                    "supplier",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rfqs",
                        to="tenders.company",
                    ),
                ),
                (
                    "tender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rfqs",
                        to="tenders.tender",
                    ),
                ),
            ],
            options={
                "ordering": ["-issued_at"],
            },
        ),
        migrations.CreateModel(
            name="SupplierOffer",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("valid_until", models.DateField(blank=True, null=True)),
                ("currency", models.CharField(default="EUR", max_length=3)),
                ("notes", models.TextField(blank=True)),
                (
                    "total_amount",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Optional total; can mirror sum of line items.",
                        max_digits=16,
                        null=True,
                    ),
                ),
                (
                    "rfq",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="supplier_offers",
                        to="tenders.rfq",
                    ),
                ),
            ],
            options={
                "ordering": ["-submitted_at"],
            },
        ),
        migrations.CreateModel(
            name="OfferItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("unit_price", models.DecimalField(decimal_places=4, max_digits=16)),
                ("quantity", models.DecimalField(decimal_places=4, max_digits=14)),
                (
                    "line_total",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Optional line total; defaults to quantity × unit_price if omitted.",
                        max_digits=16,
                        null=True,
                    ),
                ),
                (
                    "supplier_offer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="tenders.supplieroffer",
                    ),
                ),
                (
                    "tender_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="offer_items",
                        to="tenders.tenderitem",
                    ),
                ),
            ],
            options={
                "ordering": ["id"],
            },
        ),
        migrations.CreateModel(
            name="FinalOffer",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("decided_at", models.DateTimeField(auto_now_add=True)),
                ("notes", models.TextField(blank=True)),
                (
                    "supplier_offer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="final_awards",
                        to="tenders.supplieroffer",
                    ),
                ),
                (
                    "tender",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="final_offer",
                        to="tenders.tender",
                    ),
                ),
            ],
            options={
                "ordering": ["-decided_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="rfq",
            constraint=models.UniqueConstraint(
                fields=("tender", "supplier"),
                name="unique_rfq_per_tender_supplier",
            ),
        ),
        migrations.AddConstraint(
            model_name="supplieroffer",
            constraint=models.UniqueConstraint(
                fields=("rfq",),
                name="unique_supplier_offer_per_rfq",
            ),
        ),
        migrations.AddConstraint(
            model_name="offeritem",
            constraint=models.UniqueConstraint(
                fields=("supplier_offer", "tender_item"),
                name="unique_offer_line_per_tender_item",
            ),
        ),
        migrations.AddIndex(
            model_name="company",
            index=models.Index(fields=["company_type", "name"], name="tenders_com_company_8f0b8d_idx"),
        ),
        migrations.AlterModelOptions(
            name="company",
            options={"ordering": ["name"]},
        ),
        migrations.AlterModelOptions(
            name="tender",
            options={"ordering": ["-deadline", "-id"]},
        ),
    ]
