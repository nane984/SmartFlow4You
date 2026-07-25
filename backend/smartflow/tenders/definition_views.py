"""ViewSets for Tender Definition Management."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsTenderDefinitionStaff

from .definition_models import (
    ProcurementSource,
    TenderDefinition,
    TenderDefinitionExecutionLog,
    TenderKeyword,
    TenderNotification,
)
from .definition_serializers import (
    ProcurementSourceSerializer,
    TenderDefinitionExecutionLogSerializer,
    TenderDefinitionSerializer,
    TenderKeywordSerializer,
    TenderNotificationSerializer,
)
from .services.tender_import import run_tender_definition, test_tender_definition


class TenderDefinitionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenderDefinitionStaff]
    serializer_class = TenderDefinitionSerializer

    def get_queryset(self):
        return (
            TenderDefinition.objects.select_related("created_by", "default_investor")
            .prefetch_related("keywords", "sources")
            .order_by("name", "id")
        )

    @action(detail=True, methods=["post"])
    def run(self, request, pk=None):
        definition = self.get_object()
        log = run_tender_definition(definition)
        return Response(
            TenderDefinitionExecutionLogSerializer(log).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def run_test(self, request, pk=None):
        """Dry run — fetch and match without importing tenders."""
        definition = self.get_object()
        result = test_tender_definition(definition)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        definition = self.get_object()
        definition.is_active = not definition.is_active
        definition.save(update_fields=["is_active", "updated_at"])
        return Response(TenderDefinitionSerializer(definition, context={"request": request}).data)


class ProcurementSourceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenderDefinitionStaff]
    serializer_class = ProcurementSourceSerializer

    def get_queryset(self):
        qs = ProcurementSource.objects.select_related("tender_definition").order_by("name", "id")
        definition_id = self.request.query_params.get("tender_definition")
        if definition_id:
            qs = qs.filter(tender_definition_id=definition_id)
        return qs


class TenderKeywordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenderDefinitionStaff]
    serializer_class = TenderKeywordSerializer

    def get_queryset(self):
        qs = TenderKeyword.objects.select_related("tender_definition").order_by("keyword", "id")
        definition_id = self.request.query_params.get("tender_definition")
        if definition_id:
            qs = qs.filter(tender_definition_id=definition_id)
        return qs


class TenderDefinitionExecutionLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsTenderDefinitionStaff]
    serializer_class = TenderDefinitionExecutionLogSerializer

    def get_queryset(self):
        qs = TenderDefinitionExecutionLog.objects.select_related("tender_definition").order_by(
            "-started_at", "-id"
        )
        definition_id = self.request.query_params.get("tender_definition")
        if definition_id:
            qs = qs.filter(tender_definition_id=definition_id)
        return qs


class TenderNotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenderDefinitionStaff]
    serializer_class = TenderNotificationSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = TenderNotification.objects.filter(user=user).order_by("-created_at", "-id")
        if self.request.query_params.get("unread") == "1":
            qs = qs.filter(is_read=False)
        return qs

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"count": count})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"marked_read": updated})
