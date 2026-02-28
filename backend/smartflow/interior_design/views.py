from rest_framework import viewsets, permissions
from .models import InteriorProject
from .serializer import InteriorProjectSerializer

class InteriorProjectViewSet(viewsets.ModelViewSet):
    queryset = InteriorProject.objects.all()
    serializer_class = InteriorProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
