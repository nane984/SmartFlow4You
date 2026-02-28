from django.urls import path, include
from .views import JobPostViewSet, CVViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('jobpost', JobPostViewSet)
router.register('cvs', CVViewSet)

urlpattrns = [
    path('', include(router.urls)),
]