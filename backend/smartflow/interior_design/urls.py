from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ElectricalCatalogItemViewSet,
    ElectricalCategoryViewSet,
    FurnitureCatalogItemViewSet,
    FurnitureCategoryViewSet,
    InteriorProjectViewSet,
    StructureCatalogItemViewSet,
    StructureCategoryViewSet,
)

router = DefaultRouter()
router.register("projects", InteriorProjectViewSet)
router.register("furniture-categories", FurnitureCategoryViewSet)
router.register("furniture-items", FurnitureCatalogItemViewSet)
router.register("electrical-categories", ElectricalCategoryViewSet)
router.register("electrical-items", ElectricalCatalogItemViewSet)
router.register("structure-categories", StructureCategoryViewSet)
router.register("structure-items", StructureCatalogItemViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
