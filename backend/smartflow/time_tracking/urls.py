from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkLogViewSet

router = DefaultRouter()
router.register('worklogs', WorkLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]