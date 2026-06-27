from rest_framework import serializers

from .models import (
    ElectricalCatalogItem,
    ElectricalCategory,
    FurnitureCatalogItem,
    FurnitureCategory,
    InteriorProject,
    StructureCatalogItem,
    StructureCategory,
)


class FurnitureCategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = FurnitureCategory
        fields = ("id", "name", "sort_order", "item_count")

    def get_item_count(self, obj) -> int:
        return obj.items.filter(is_active=True).count()


class FurnitureCatalogItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    image_url = serializers.SerializerMethodField()
    cad_url = serializers.SerializerMethodField()

    class Meta:
        model = FurnitureCatalogItem
        fields = (
            "id",
            "category",
            "category_name",
            "identifier",
            "name",
            "description",
            "width",
            "depth",
            "height",
            "color",
            "image",
            "image_url",
            "cad_file",
            "cad_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "category_name", "image_url", "cad_url", "created_at", "updated_at")

    def _file_url(self, obj, field_name: str) -> str | None:
        file_field = getattr(obj, field_name, None)
        if not file_field:
            return None
        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_image_url(self, obj) -> str | None:
        return self._file_url(obj, "image")

    def get_cad_url(self, obj) -> str | None:
        return self._file_url(obj, "cad_file")

    def validate_width(self, value):
        if value <= 0:
            raise serializers.ValidationError("Width must be greater than zero.")
        return value

    def validate_depth(self, value):
        if value <= 0:
            raise serializers.ValidationError("Depth must be greater than zero.")
        return value

    def validate_height(self, value):
        if value <= 0:
            raise serializers.ValidationError("Height must be greater than zero.")
        return value


class ElectricalCategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = ElectricalCategory
        fields = ("id", "name", "sort_order", "item_count")

    def get_item_count(self, obj) -> int:
        return obj.items.filter(is_active=True).count()


class ElectricalCatalogItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    image_url = serializers.SerializerMethodField()
    cad_url = serializers.SerializerMethodField()

    class Meta:
        model = ElectricalCatalogItem
        fields = (
            "id",
            "category",
            "category_name",
            "identifier",
            "name",
            "description",
            "part_type",
            "width",
            "depth",
            "height",
            "vertical_mount",
            "mount_elevation",
            "color",
            "voltage_v",
            "amperage_a",
            "wire_gauge_mm2",
            "circuit_id",
            "phases",
            "image",
            "image_url",
            "cad_file",
            "cad_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "category_name", "image_url", "cad_url", "created_at", "updated_at")

    def _file_url(self, obj, field_name: str) -> str | None:
        file_field = getattr(obj, field_name, None)
        if not file_field:
            return None
        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_image_url(self, obj) -> str | None:
        return self._file_url(obj, "image")

    def get_cad_url(self, obj) -> str | None:
        return self._file_url(obj, "cad_file")

    def validate_width(self, value):
        if value <= 0:
            raise serializers.ValidationError("Width must be greater than zero.")
        return value

    def validate_depth(self, value):
        if value <= 0:
            raise serializers.ValidationError("Depth must be greater than zero.")
        return value

    def validate_phases(self, value):
        if value is not None and value not in (1, 3):
            raise serializers.ValidationError("Phases must be 1 or 3.")
        return value


class StructureCategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = StructureCategory
        fields = ("id", "name", "sort_order", "item_count")

    def get_item_count(self, obj) -> int:
        return obj.items.filter(is_active=True).count()


class StructureCatalogItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    image_url = serializers.SerializerMethodField()
    cad_url = serializers.SerializerMethodField()

    class Meta:
        model = StructureCatalogItem
        fields = (
            "id",
            "category",
            "category_name",
            "identifier",
            "name",
            "description",
            "part_type",
            "width",
            "depth",
            "height",
            "elevation",
            "color",
            "image",
            "image_url",
            "cad_file",
            "cad_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "category_name", "image_url", "cad_url", "created_at", "updated_at")

    def _file_url(self, obj, field_name: str) -> str | None:
        file_field = getattr(obj, field_name, None)
        if not file_field:
            return None
        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_image_url(self, obj) -> str | None:
        return self._file_url(obj, "image")

    def get_cad_url(self, obj) -> str | None:
        return self._file_url(obj, "cad_file")

    def validate_depth(self, value):
        if value <= 0:
            raise serializers.ValidationError("Thickness must be greater than zero.")
        return value

    def validate_height(self, value):
        if value <= 0:
            raise serializers.ValidationError("Height must be greater than zero.")
        return value


class InteriorProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    floorplan_url = serializers.SerializerMethodField()
    cad_url = serializers.SerializerMethodField()

    class Meta:
        model = InteriorProject
        fields = (
            "id",
            "client_name",
            "description",
            "floorplan_file",
            "floorplan_url",
            "cad_file",
            "cad_url",
            "style_preference",
            "layout_data",
            "ai_generated_images",
            "ai_suggestions",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
            "floorplan_url",
            "cad_url",
            "ai_suggestions",
        )

    def get_created_by_name(self, obj) -> str:
        if not obj.created_by_id:
            return ""
        user = obj.created_by
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.username

    def _file_url(self, obj, field_name: str) -> str | None:
        file_field = getattr(obj, field_name, None)
        if not file_field:
            return None
        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_floorplan_url(self, obj) -> str | None:
        return self._file_url(obj, "floorplan_file")

    def get_cad_url(self, obj) -> str | None:
        return self._file_url(obj, "cad_file")


def catalog_item_to_dict(item: FurnitureCatalogItem) -> dict:
    return {
        "id": item.id,
        "identifier": item.identifier,
        "label": item.name,
        "name": item.name,
        "width": float(item.width),
        "depth": float(item.depth),
        "height": float(item.height),
        "color": item.color,
        "category_id": item.category_id,
        "category_name": item.category.name,
    }
