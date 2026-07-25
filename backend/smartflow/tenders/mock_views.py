"""Mock public procurement API for development and demo."""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .mock_data import MOCK_PROCUREMENTS


class MockProcurementsAPIView(APIView):
    """
    Simulates an external public procurement feed.

    GET /api/mock/procurements/
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(MOCK_PROCUREMENTS)
