"""Keyword matching for incoming public procurements."""

from __future__ import annotations

import json

from .procurement_types import RawProcurement


class TenderMatchingService:
    """Matches procurements against tender definition keywords."""

    def matches(self, record: RawProcurement, keywords: list[str]) -> bool:
        if not keywords:
            return True
        haystack = self._build_haystack(record)
        return any(kw.lower() in haystack for kw in keywords if kw.strip())

    def filter_matching(
        self,
        records: list[RawProcurement],
        keywords: list[str],
    ) -> tuple[list[RawProcurement], list[RawProcurement]]:
        """Returns (matching, ignored) record lists."""
        matching: list[RawProcurement] = []
        ignored: list[RawProcurement] = []
        for record in records:
            if self.matches(record, keywords):
                matching.append(record)
            else:
                ignored.append(record)
        return matching, ignored

    def _build_haystack(self, record: RawProcurement) -> str:
        return " ".join(
            [
                record.title,
                record.description,
                record.category,
                json.dumps(record.metadata, default=str),
            ]
        ).lower()
