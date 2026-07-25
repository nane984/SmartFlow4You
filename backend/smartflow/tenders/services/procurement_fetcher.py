"""Fetch and normalize procurement data from external sources."""

from __future__ import annotations

import csv
import io
import json
import xml.etree.ElementTree as ET
from urllib.error import URLError
from urllib.request import Request, urlopen

from ..definition_models import ProcurementSource
from .procurement_types import RawProcurement, extract_records, normalize_record


class ProcurementFetcherService:
    """Calls external procurement APIs and returns normalized records."""

    TIMEOUT = 30
    USER_AGENT = "SmartFlow/1.0"

    def fetch_source(self, source: ProcurementSource) -> list[RawProcurement]:
        if source.source_type == ProcurementSource.SourceType.API:
            return self.fetch_from_api(source.api_url)
        if source.source_type == ProcurementSource.SourceType.CSV:
            return self.fetch_from_csv(source.api_url)
        if source.source_type == ProcurementSource.SourceType.XML:
            return self.fetch_from_xml(source.api_url)
        raise ValueError(f"Source type '{source.source_type}' is not supported yet.")

    def fetch_from_api(self, url: str) -> list[RawProcurement]:
        request = Request(url, headers={"Accept": "application/json", "User-Agent": self.USER_AGENT})
        with urlopen(request, timeout=self.TIMEOUT) as response:
            body = response.read().decode("utf-8")
        payload = json.loads(body)
        records: list[RawProcurement] = []
        for item in extract_records(payload):
            normalized = normalize_record(item)
            if normalized:
                records.append(normalized)
        return records

    def fetch_from_csv(self, url: str) -> list[RawProcurement]:
        request = Request(url, headers={"User-Agent": self.USER_AGENT})
        with urlopen(request, timeout=self.TIMEOUT) as response:
            body = response.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(body))
        records: list[RawProcurement] = []
        for row in reader:
            normalized = normalize_record(dict(row))
            if normalized:
                records.append(normalized)
        return records

    def fetch_from_xml(self, url: str) -> list[RawProcurement]:
        request = Request(url, headers={"User-Agent": self.USER_AGENT})
        with urlopen(request, timeout=self.TIMEOUT) as response:
            body = response.read()
        root = ET.fromstring(body)
        records: list[RawProcurement] = []
        for node in root.findall(".//procurement") + root.findall(".//item") + root.findall(".//notice"):
            raw = {child.tag.split("}")[-1]: (child.text or "").strip() for child in node}
            if node.attrib:
                raw.update(node.attrib)
            normalized = normalize_record(raw)
            if normalized:
                records.append(normalized)
        return records

    def fetch_all_enabled(self, definition) -> tuple[list[tuple[ProcurementSource, list[RawProcurement]]], list[str]]:
        """Returns ((source, records), ...) and source-level errors."""
        batches: list[tuple[ProcurementSource, list[RawProcurement]]] = []
        errors: list[str] = []
        for source in definition.sources.filter(enabled=True):
            try:
                records = self.fetch_source(source)
                batches.append((source, records))
            except (URLError, ValueError, json.JSONDecodeError, ET.ParseError) as exc:
                errors.append(f"{source.name}: {exc}")
        return batches, errors
