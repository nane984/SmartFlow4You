from django.urls import path, include
from .views import UserViewSet, RegisterViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('register', RegisterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]