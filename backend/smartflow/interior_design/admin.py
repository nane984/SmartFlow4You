from django.contrib import admin

from .models import (
    ElectricalCatalogItem,
    ElectricalCategory,
    FurnitureCatalogItem,
    FurnitureCategory,
    InteriorProject,
    StructureCatalogItem,
    StructureCategory,
)


class FurnitureCatalogItemInline(admin.TabularInline):
    model = FurnitureCatalogItem
    extra = 0
    fields = ("identifier", "name", "width", "depth", "height", "is_active")


@admin.register(FurnitureCategory)
class FurnitureCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "sort_order")
    ordering = ("sort_order", "name")
    inlines = [FurnitureCatalogItemInline]


@admin.register(FurnitureCatalogItem)
class FurnitureCatalogItemAdmin(admin.ModelAdmin):
    list_display = ("identifier", "name", "category", "width", "depth", "height", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("identifier", "name")


class ElectricalCatalogItemInline(admin.TabularInline):
    model = ElectricalCatalogItem
    extra = 0
    fields = ("identifier", "name", "part_type", "voltage_v", "amperage_a", "is_active")


@admin.register(ElectricalCategory)
class ElectricalCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "sort_order")
    ordering = ("sort_order", "name")
    inlines = [ElectricalCatalogItemInline]


@admin.register(ElectricalCatalogItem)
class ElectricalCatalogItemAdmin(admin.ModelAdmin):
    list_display = (
        "identifier",
        "name",
        "category",
        "part_type",
        "voltage_v",
        "amperage_a",
        "is_active",
    )
    list_filter = ("category", "part_type", "is_active")
    search_fields = ("identifier", "name", "circuit_id")


class StructureCatalogItemInline(admin.TabularInline):
    model = StructureCatalogItem
    extra = 0
    fields = ("identifier", "name", "part_type", "color", "is_active")


@admin.register(StructureCategory)
class StructureCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "sort_order")
    ordering = ("sort_order", "name")
    inlines = [StructureCatalogItemInline]


@admin.register(StructureCatalogItem)
class StructureCatalogItemAdmin(admin.ModelAdmin):
    list_display = ("identifier", "name", "category", "part_type", "color", "is_active")
    list_filter = ("category", "part_type", "is_active")
    search_fields = ("identifier", "name")


@admin.register(InteriorProject)
class InteriorProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "client_name", "created_by", "created_at", "updated_at")
    search_fields = ("client_name", "description")
    readonly_fields = ("created_at", "updated_at")
