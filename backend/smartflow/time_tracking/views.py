from rest_framework import viewsets, permissions
from .models import WorkLog
from .serializer import WorkLogSerializer

class WorkLogViewSet(viewsets.ModelViewSet):
    queryset = WorkLog.objects.all()
    serializer_class = WorkLogSerializer
    permission_classes = [permissions.IsAuthenticated]
