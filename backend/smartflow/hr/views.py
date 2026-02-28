from rest_framework import viewsets, permissions
from .models import JobPost, CV
from .serializer import JobPostSerializer, CVSerializer

class JobPostViewSet(viewsets.ModelViewSet):
    queryset = JobPost.objects.all()
    serializer_class = JobPostSerializer
    permission_classes = [permissions.IsAuthenticated]


class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.all()
    serializer_class = CVSerializer
    permission_classes = [permissions.IsAuthenticated]