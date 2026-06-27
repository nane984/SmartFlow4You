from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from core.permissions import IsDesignStaff

from .ai_helpers import generate_ai_suggestions
from .catalog_service import (
    get_furniture_catalog,
    get_grouped_electrical_catalog,
    get_grouped_furniture_catalog,
    get_grouped_structure_catalog,
)
from .models import (
    ElectricalCatalogItem,
    ElectricalCategory,
    FurnitureCatalogItem,
    FurnitureCategory,
    InteriorProject,
    StructureCatalogItem,
    StructureCategory,
)
from .serializer import (
    ElectricalCatalogItemSerializer,
    ElectricalCategorySerializer,
    FurnitureCatalogItemSerializer,
    FurnitureCategorySerializer,
    InteriorProjectSerializer,
    StructureCatalogItemSerializer,
    StructureCategorySerializer,
)


class FurnitureCategoryViewSet(viewsets.ModelViewSet):
    queryset = FurnitureCategory.objects.all()
    serializer_class = FurnitureCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsDesignStaff]


class FurnitureCatalogItemViewSet(viewsets.ModelViewSet):
    queryset = FurnitureCatalogItem.objects.select_related("category").all()
    serializer_class = FurnitureCatalogItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsDesignStaff]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)
        active = self.request.query_params.get("active")
        if active == "1":
            qs = qs.filter(is_active=True)
        return qs


class ElectricalCategoryViewSet(viewsets.ModelViewSet):
    queryset = ElectricalCategory.objects.all()
    serializer_class = ElectricalCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsDesignStaff]


class ElectricalCatalogItemViewSet(viewsets.ModelViewSet):
    queryset = ElectricalCatalogItem.objects.select_related("category").all()
    serializer_class = ElectricalCatalogItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsDesignStaff]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)
        active = self.request.query_params.get("active")
        if active == "1":
            qs = qs.filter(is_active=True)
        return qs


class StructureCategoryViewSet(viewsets.ModelViewSet):
    queryset = StructureCategory.objects.all()
    serializer_class = StructureCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsDesignStaff]


class StructureCatalogItemViewSet(viewsets.ModelViewSet):
    queryset = StructureCatalogItem.objects.select_related("category").all()
    serializer_class = StructureCatalogItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsDesignStaff]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)
        active = self.request.query_params.get("active")
        if active == "1":
            qs = qs.filter(is_active=True)
        return qs


class InteriorProjectViewSet(viewsets.ModelViewSet):
    """Interior design / CAD projects — designer and admin only."""

    queryset = InteriorProject.objects.select_related("created_by").all()
    serializer_class = InteriorProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsDesignStaff]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="furniture-catalog")
    def furniture_catalog(self, request):
        return Response(get_grouped_furniture_catalog(request))

    @action(detail=False, methods=["get"], url_path="electrical-catalog")
    def electrical_catalog(self, request):
        return Response(get_grouped_electrical_catalog(request))

    @action(detail=False, methods=["get"], url_path="structure-catalog")
    def structure_catalog(self, request):
        return Response(get_grouped_structure_catalog(request))

    @action(detail=False, methods=["get"], url_path="furniture-catalog-flat")
    def furniture_catalog_flat(self, request):
        return Response(get_furniture_catalog())

    @action(detail=False, methods=["get"], url_path="ai-status")
    def ai_status(self, request):
        from .llm_service import is_llm_available

        return Response(
            {
                "llm_configured": is_llm_available(),
                "model": settings.OPENAI_MODEL if is_llm_available() else None,
            }
        )

    @action(detail=True, methods=["post"], url_path="ai-suggest")
    def ai_suggest(self, request, pk=None):
        project = self.get_object()
        prompt = request.data.get("prompt", "")
        if not isinstance(prompt, str) or not prompt.strip():
            return Response({"prompt": "Prompt text is required."}, status=status.HTTP_400_BAD_REQUEST)

        result = generate_ai_suggestions(
            prompt.strip(),
            project.layout_data,
            project_description=project.description or "",
        )
        project.ai_suggestions = result.get("suggestions", [])
        project.save(update_fields=["ai_suggestions", "updated_at"])

        return Response(result)

    @action(detail=True, methods=["post"], url_path="apply-layout")
    def apply_layout(self, request, pk=None):
        project = self.get_object()
        layout = request.data.get("layout_data")
        if not isinstance(layout, dict):
            return Response({"layout_data": "Expected a JSON object."}, status=status.HTTP_400_BAD_REQUEST)
        project.layout_data = layout
        style = request.data.get("style_preference")
        if isinstance(style, dict):
            project.style_preference = style
        project.save(update_fields=["layout_data", "style_preference", "updated_at"])
        return Response(InteriorProjectSerializer(project, context={"request": request}).data)
