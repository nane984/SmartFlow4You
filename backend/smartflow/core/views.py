from rest_framework import viewsets, permissions
from .models import User
from .serializer import UserSerializer, RegisterSerializer

class UserViewSet(viewsets.ModelViewSet):   #ModelViewSet obuhvata sve metode, get, post, put, delete ...
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class RegisterViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]