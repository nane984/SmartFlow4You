"""Serializers for Tender Definition Management."""

from rest_framework import serializers

from .definition_models import (
    ProcurementSource,
    TenderDefinition,
    TenderDefinitionExecutionLog,
    TenderKeyword,
    TenderNotification,
)


class TenderKeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderKeyword
        fields = ["id", "tender_definition", "keyword"]
        read_only_fields = ["id"]


class ProcurementSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcurementSource
        fields = [
            "id",
            "tender_definition",
            "name",
            "api_url",
            "source_type",
            "enabled",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TenderDefinitionExecutionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderDefinitionExecutionLog
        fields = [
            "id",
            "tender_definition",
            "started_at",
            "finished_at",
            "status",
            "received_count",
            "matched_count",
            "duplicate_count",
            "processed_count",
            "imported_count",
            "skipped_count",
            "error_message",
        ]
        read_only_fields = fields


class TenderDefinitionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    default_investor_name = serializers.CharField(
        source="default_investor.name",
        read_only=True,
    )
    keywords = TenderKeywordSerializer(many=True, read_only=True)
    sources = ProcurementSourceSerializer(many=True, read_only=True)
    keyword_list = serializers.ListField(
        child=serializers.CharField(max_length=128),
        write_only=True,
        required=False,
    )
    source_list = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = TenderDefinition
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "created_by_name",
            "default_investor",
            "default_investor_name",
            "check_frequency",
            "is_active",
            "last_checked",
            "last_successful_check",
            "created_at",
            "updated_at",
            "keywords",
            "sources",
            "keyword_list",
            "source_list",
        ]
        read_only_fields = [
            "created_by",
            "created_by_name",
            "last_checked",
            "last_successful_check",
            "created_at",
            "updated_at",
            "keywords",
            "sources",
        ]

    def get_created_by_name(self, obj: TenderDefinition) -> str | None:
        user = obj.created_by
        if not user:
            return None
        full = f"{user.first_name} {user.last_name}".strip()
        return full or user.username

    def _save_keywords(self, definition: TenderDefinition, keywords: list[str]) -> None:
        definition.keywords.all().delete()
        seen: set[str] = set()
        for raw in keywords:
            kw = raw.strip()
            if not kw or kw.lower() in seen:
                continue
            seen.add(kw.lower())
            TenderKeyword.objects.create(tender_definition=definition, keyword=kw)

    def _save_sources(self, definition: TenderDefinition, sources: list[dict]) -> None:
        definition.sources.all().delete()
        for item in sources:
            name = str(item.get("name", "")).strip()
            api_url = str(item.get("api_url", "")).strip()
            if not name or not api_url:
                continue
            ProcurementSource.objects.create(
                tender_definition=definition,
                name=name,
                api_url=api_url,
                source_type=item.get("source_type", ProcurementSource.SourceType.API),
                enabled=bool(item.get("enabled", True)),
            )

    def create(self, validated_data):
        keywords = validated_data.pop("keyword_list", [])
        sources = validated_data.pop("source_list", [])
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        definition = super().create(validated_data)
        if keywords:
            self._save_keywords(definition, keywords)
        if sources:
            self._save_sources(definition, sources)
        return definition

    def update(self, instance, validated_data):
        keywords = validated_data.pop("keyword_list", None)
        sources = validated_data.pop("source_list", None)
        definition = super().update(instance, validated_data)
        if keywords is not None:
            self._save_keywords(definition, keywords)
        if sources is not None:
            self._save_sources(definition, sources)
        return definition


class TenderNotificationSerializer(serializers.ModelSerializer):
    tender_id = serializers.IntegerField(source="tender_id", read_only=True, allow_null=True)

    class Meta:
        model = TenderNotification
        fields = ["id", "title", "message", "link", "tender_id", "is_read", "created_at"]
        read_only_fields = ["id", "title", "message", "link", "tender_id", "created_at"]
